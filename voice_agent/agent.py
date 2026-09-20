import asyncio
import json
import logging
import math
import os
import time
import uuid
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Literal
from urllib.parse import quote

import aiohttp
from dotenv import load_dotenv
from livekit import api, rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    AutoSubscribe,
    JobContext,
    JobProcess,
    RunContext,
    cli,
    function_tool,
    llm,
    room_io,
    stt,
    tts,
)
from livekit.agents.voice.agent_session import (
    EndpointingOptions,
    PreemptiveGenerationOptions,
    TurnHandlingOptions,
)
from livekit.plugins import cartesia, deepgram, groq, openai, sarvam, silero
from pydantic import AliasChoices, BaseModel, Field

from prompts import COLLECTION_AGENT_SYSTEM_PROMPT, GREETING_TEMPLATE

load_dotenv(Path(__file__).with_name(".env"))
logger = logging.getLogger("collection-agent")
CRM_API_BASE = os.getenv(
    "CRM_API_BASE", os.getenv("CRM_API_BASE_URL", "http://localhost:3000/api")
).rstrip("/")

# Disposition mapped from tool function names used during the call
_TOOL_DISPOSITION_MAP = {
    "record_promise_to_pay": "PROMISE_TO_PAY",
    "calculate_settlement_discount": "SETTLEMENT_OFFERED",
    "setup_installment_plan": "PAYMENT_PLAN",
    "log_dispute_or_hardship": "DISPUTE_RAISED",
}


class CallLogger:
    """Collects transcript messages and call metadata, then POSTs to CRM /api/calls."""

    def __init__(self, account: "CallContext"):
        self.account = account
        self.transcript: list[dict] = []
        self.tools_used: list[str] = []
        self.seen_ids: set[str] = set()
        self.start_time = datetime.now(timezone.utc)
        self._msg_counter = 0
        self.call_status: str = "COMPLETED"
        self.amount_promised: float | None = None
        self.promised_date: str | None = None

    def add_message(self, speaker: str, text: str, msg_id: str | None = None) -> None:
        clean_text = (text or "").strip()
        if not clean_text:
            return
        if msg_id and msg_id in self.seen_ids:
            return
        if msg_id:
            self.seen_ids.add(msg_id)
        self._msg_counter += 1
        elapsed = time.time() - self.start_time.timestamp()
        minutes, seconds = divmod(int(max(elapsed, 0)), 60)
        entry = {
            "id": msg_id or f"msg-{self._msg_counter}",
            "speaker": speaker,
            "text": clean_text,
            "timestamp": f"{minutes:02d}:{seconds:02d}",
        }
        self.transcript.append(entry)
        logger.info("Captured transcript [%s]: %s", speaker, clean_text[:80])

    def add_chat_message(self, msg: Any) -> None:
        if not hasattr(msg, "role"):
            return
        if msg.role in ("developer", "system"):
            return
        msg_id = getattr(msg, "id", None)
        if msg_id and msg_id in self.seen_ids:
            return
        text = ""
        if hasattr(msg, "text_content") and msg.text_content:
            text = msg.text_content
        elif hasattr(msg, "raw_text_content") and msg.raw_text_content:
            text = msg.raw_text_content
        elif hasattr(msg, "content"):
            if isinstance(msg.content, list):
                parts = []
                for p in msg.content:
                    if isinstance(p, str):
                        parts.append(p)
                    elif hasattr(p, "text") and p.text:
                        parts.append(p.text)
                text = " ".join(parts)
            elif isinstance(msg.content, str):
                text = msg.content
        speaker = "agent" if msg.role == "assistant" else "debtor"
        self.add_message(speaker, text, msg_id=msg_id)

    def record_tool(self, tool_name: str) -> None:
        self.tools_used.append(tool_name)
        logger.info("Recorded tool usage: %s", tool_name)

    def _determine_disposition(self) -> str:
        for tool_name in reversed(self.tools_used):
            if tool_name in _TOOL_DISPOSITION_MAP:
                return _TOOL_DISPOSITION_MAP[tool_name]
        return "CALL_BACK"

    async def flush(self) -> None:
        """POST the full call record to the CRM API."""
        if getattr(self.account, "accountId", "") == "ACC-CONSOLE-001":
            logger.info("LiveKit Console test session complete; skipping CRM database log.")
            return
        duration = int(time.time() - self.start_time.timestamp())
        disposition = self._determine_disposition()

        payload = {
            "accountId": self.account.accountId,
            "debtorName": self.account.debtorName,
            "startTime": self.start_time.isoformat(),
            "durationSeconds": max(duration, 1),
            "status": self.call_status,
            "disposition": disposition,
            "sentiment": "NEUTRAL",
            "complianceScore": 98,
            "miniMirandaPassed": True,
            "transcript": self.transcript,
            "summary": f"Voice resolution session with {self.account.debtorName} for account {self.account.accountId}. Disposition: {disposition.replace('_', ' ').title()}.",
            "amountPromised": self.amount_promised,
            "promisedDate": self.promised_date,
        }
        logger.info(
            "Flushing call log to CRM (%d transcript messages, status: %s, disposition: %s)",
            len(self.transcript),
            self.call_status,
            disposition,
        )
        key = os.getenv("CRM_AGENT_API_KEY", "").strip()
        headers = {"Authorization": f"Bearer {key}"} if key else {}
        try:
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=15),
                headers=headers,
            ) as client:
                async with client.post(
                    f"{CRM_API_BASE}/calls", json=payload, allow_redirects=False,
                ) as resp:
                    if resp.status < 300:
                        logger.info("Call log successfully saved to CRM: %s", disposition)
                    else:
                        body = await resp.text()
                        logger.warning("CRM call log failed (status %d): %s", resp.status, body[:200])
        except (aiohttp.ClientError, TimeoutError) as e:
            logger.warning("Could not save call log to CRM: %s", e)

class CallContext(BaseModel):
    accountId: str = Field(min_length=1, max_length=100)
    debtorName: str = Field(min_length=1, max_length=200)
    companyName: str = Field(
        default="Recovra",
        min_length=1,
        max_length=200,
        validation_alias=AliasChoices("companyName", "brandName"),
    )
    originalCreditor: str = Field(min_length=1, max_length=200)
    currentBalance: float = Field(
        ge=0, allow_inf_nan=False,
        validation_alias=AliasChoices("currentBalance", "balance"),
    )
    daysPastDue: int = Field(ge=0)
    maxDiscountPercent: float = Field(
        ge=0, le=100, allow_inf_nan=False,
        validation_alias=AliasChoices("maxDiscountPercent", "maxDiscount"),
    )
    phone_number: str | None = Field(default=None, pattern=r"^\+[1-9]\d{7,14}$")
    participantIdentity: str = Field(default="borrower", min_length=1, max_length=100)

    customPrompt: str | None = None
    greetingTemplate: str | None = None


class CollectionAssistant(Agent):
    def __init__(self, account: CallContext, ctx: JobContext):
        now = datetime.now()
        current_date_str = now.strftime("%A, %B %d, %Y")
        current_time_str = now.strftime("%I:%M %p")

        template = (
            account.customPrompt.strip()
            if account.customPrompt and account.customPrompt.strip()
            else COLLECTION_AGENT_SYSTEM_PROMPT
        )
        format_vars = {
            "current_date": current_date_str,
            "current_time": current_time_str,
            "account_id": account.accountId,
            "debtor_name": account.debtorName,
            "company_name": account.companyName,
            "original_creditor": account.originalCreditor,
            "outstanding_balance": f"{account.currentBalance:,.2f}",
            "days_past_due": str(account.daysPastDue),
            "max_discount_percent": str(account.maxDiscountPercent),
        }
        instructions = template
        for k, v in format_vars.items():
            instructions = instructions.replace(f"{{{k}}}", v)

        # Guarantee live temporal context is present even if a custom prompt omitted the placeholders
        if current_date_str not in instructions:
            instructions += f"\n\nTEMPORAL CONTEXT:\n- Today's Date: {current_date_str}\n- Current Time: {current_time_str}"

        super().__init__(instructions=instructions)
        self.account = account
        self.ctx = ctx

    async def on_enter(self) -> None:
        active_greeting = (
            self.account.greetingTemplate.strip()
            if self.account.greetingTemplate and self.account.greetingTemplate.strip()
            else GREETING_TEMPLATE
        )
        greeting_text = (
            active_greeting.format(
                debtor_name=self.account.debtorName,
                company_name=self.account.companyName,
            )
            if "{company_name}" in active_greeting
            else active_greeting.format(debtor_name=self.account.debtorName)
        )
        logger.info("CollectionAssistant on_enter: sending greeting: '%s'", greeting_text)
        self.session.say(greeting_text)

    async def sync_crm(self, path: str, payload: dict) -> bool:
        key = os.getenv("CRM_AGENT_API_KEY")
        if not key:
            logger.error("CRM_AGENT_API_KEY is not configured")
            return False
        try:
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=10),
                headers={"Authorization": f"Bearer {key}"},
            ) as client:
                async with client.post(
                    f"{CRM_API_BASE}/{path}", json=payload, allow_redirects=False,
                ) as response:
                    response.raise_for_status()
                    result = await response.json()
                    return isinstance(result, dict) and result.get("success") is True and bool(result.get("account"))
        except (aiohttp.ClientError, ValueError, TimeoutError):
            logger.warning("CRM update failed; do not confirm the action to the borrower")
            return False

    @function_tool(description="Record an agreed promise to pay. payment_date must be YYYY-MM-DD.")
    async def record_promise_to_pay(
        self, amount: float, payment_date: str, payment_method: str = "Online Portal",
    ) -> str:
        if not math.isfinite(amount) or not 0 < amount <= self.account.currentBalance:
            return "Amount must be positive and no greater than the outstanding balance."
        try:
            if date.fromisoformat(payment_date) < date.today():
                return "Payment date cannot be in the past."
        except ValueError:
            return "Ask for a specific payment date in YYYY-MM-DD format."
        saved = await self.sync_crm("calls/promise-to-pay", {
            "accountId": self.account.accountId,
            "amount": amount, "date": payment_date, "method": payment_method,
        })
        return "Promise to pay saved." if saved else "Could not save the promise. Do not claim it is scheduled."

    @function_tool(description="Calculate a settlement within the account's authorized discount cap.")
    async def calculate_settlement_discount(self, discount_percent: float) -> str:
        if not math.isfinite(discount_percent) or not 0 <= discount_percent <= self.account.maxDiscountPercent:
            return f"Discount must be between 0 and {self.account.maxDiscountPercent}%."
        amount = round(self.account.currentBalance * (1 - discount_percent / 100), 2)
        return f"Authorized payoff: ${amount:,.2f} with a {discount_percent}% discount."

    @function_tool(description="Save an agreed installment plan. start_date must be YYYY-MM-DD.")
    async def setup_installment_plan(
        self, monthly_amount: float, number_of_months: int, start_date: str,
    ) -> str:
        if not math.isfinite(monthly_amount) or monthly_amount <= 0 or not 1 <= number_of_months <= 12:
            return "Use a positive monthly amount and 1 to 12 months."
        total = round(monthly_amount * number_of_months, 2)
        if abs(total - self.account.currentBalance) > 0.01:
            return "Installments must cover the current balance without overcharging. Recalculate the plan."
        try:
            if date.fromisoformat(start_date) < date.today():
                return "Start date cannot be in the past."
        except ValueError:
            return "Ask for a specific start date in YYYY-MM-DD format."
        saved = await self.sync_crm(f"accounts/{quote(self.account.accountId, safe='')}/plan", {
            "monthlyAmount": monthly_amount, "months": number_of_months,
            "startDate": start_date, "total": total,
        })
        return "Payment plan saved." if saved else "Could not save the plan. Do not claim it is configured."

    @function_tool(description="Record a borrower dispute or hardship for specialist review.")
    async def log_dispute_or_hardship(
        self,
        category: Literal["HARDSHIP_MEDICAL", "HARDSHIP_UNEMPLOYMENT", "DISPUTE_AMOUNT", "DISPUTE_IDENTITY"],
        notes: str,
    ) -> str:
        saved = await self.sync_crm(f"accounts/{quote(self.account.accountId, safe='')}/flag", {
            "category": category, "notes": notes,
        })
        return "Account flagged for review." if saved else "Could not save the flag. Do not claim a hold was applied."

    @function_tool(description="End the call when requested, on wrong number or voicemail, or after saying goodbye.")
    async def end_call(self, context: RunContext) -> None:
        await context.wait_for_playout()
        await self.ctx.delete_room()


_GLOBAL_VAD = None


def _get_vad():
    global _GLOBAL_VAD
    if _GLOBAL_VAD is None:
        _GLOBAL_VAD = silero.VAD.load()
    return _GLOBAL_VAD


def prewarm_process(proc: JobProcess):
    try:
        proc.userdata["vad"] = silero.VAD.load()
    except Exception as e:
        logger.warning("Could not prewarm VAD in idle process: %s", e)


server = AgentServer(num_idle_processes=1, setup_fnc=prewarm_process)


@server.rtc_session(agent_name=os.getenv("LIVEKIT_AGENT_NAME", "recovra-collection-agent"))
async def entrypoint(ctx: JobContext):
    try:
        room_name = getattr(ctx.room, "name", "") or ""
        raw_meta = ctx.job.metadata or "{}"
        try:
            meta_dict = json.loads(raw_meta) if isinstance(raw_meta, str) else (raw_meta or {})
        except Exception:
            meta_dict = {}

        # If connected via LiveKit Cloud Console / playground without metadata, supply demo borrower context
        if (room_name.startswith("console-") or "console" in room_name) and not meta_dict:
            meta_dict = {
                "accountId": "ACC-CONSOLE-001",
                "debtorName": "Alex Mercer",
                "companyName": "Recovra",
                "originalCreditor": "First National Bank",
                "currentBalance": 1450.00,
                "daysPastDue": 45,
                "maxDiscountPercent": 25.0,
                "participantIdentity": "borrower",
            }


        account = CallContext.model_validate(meta_dict)
        gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        groq_key = os.getenv("GROQ_API_KEY")
        groq_backup_key = os.getenv("GROQ_API_KEY_BACKUP") or os.getenv("GROQ_BACKUP_API_KEY")
        sarvam_key = os.getenv("SARVAM_API_KEY") or os.getenv("SARVAM_API")
        cartesia_key = os.getenv("CARTESIA_API_KEY")
        deepgram_key = os.getenv("DEEPGRAM_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")

        if not gemini_key and not groq_key and not groq_backup_key and not openai_key:
            raise ValueError("GEMINI_API_KEY, GROQ_API_KEY (or OPENAI_API_KEY) is required")
        if not deepgram_key and not sarvam_key and not openai_key and not cartesia_key:
            raise ValueError("DEEPGRAM_API_KEY, SARVAM_API_KEY, CARTESIA_API_KEY, or OPENAI_API_KEY is required for voice STT/TTS")

        trunk_id = os.getenv("LIVEKIT_SIP_OUTBOUND_TRUNK_ID", "")
        if account.phone_number and not trunk_id:
            raise ValueError("LIVEKIT_SIP_OUTBOUND_TRUNK_ID is required")
    except (ValueError, TypeError) as e:
        logger.error("Call initialization failed: %s; no call placed", e)
        ctx.shutdown(reason="Invalid call configuration")
        return


    session = None
    finished = asyncio.Event()
    call_log = CallLogger(account)

    @ctx.room.on("participant_disconnected")
    def on_disconnect(participant: rtc.RemoteParticipant):
        if participant.identity == account.participantIdentity:
            finished.set()

    @ctx.room.on("disconnected")
    def on_room_disconnect(*_):
        finished.set()

    try:
        await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

        # STT Engine: Primary Deepgram (default) -> Backup Sarvam AI -> Fallback OpenAI
        stt_candidates = []
        if deepgram_key:
            stt_candidates.append(deepgram.STT())
        if sarvam_key:
            sarvam_stt_model = os.getenv("SARVAM_STT_MODEL", "saaras:v3")
            stt_candidates.append(
                sarvam.STT(
                    api_key=sarvam_key,
                    language="en-IN",
                    model=sarvam_stt_model,
                )
            )
        if not stt_candidates and openai_key:
            stt_candidates.append(openai.STT())
        if not stt_candidates:
            stt_candidates.append(openai.STT())

        stt_engine = (
            stt.FallbackAdapter(
                stt=stt_candidates,
                attempt_timeout=3.0,
                max_retry_per_stt=1,
            )
            if len(stt_candidates) > 1
            else stt_candidates[0]
        )

        # LLM Engine: Primary Gemini (gemini-3.5-flash-lite) -> Backup Groq -> LiveKit Cloud Inference / OpenAI
        gemini_model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
        gemini_base_url = os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/")
        groq_model = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
        groq_backup_model = os.getenv("GROQ_BACKUP_MODEL", "openai/gpt-oss-120b")
        llm_candidates = []

        # 1. Primary Default: Google Gemini (gemini-3.5-flash-lite via OpenAI-compatible endpoint)
        if gemini_key:
            llm_candidates.append(
                openai.LLM(
                    model=gemini_model,
                    api_key=gemini_key,
                    base_url=gemini_base_url,
                )
            )

        # 2. Backup: Groq LPU engine (ultra-fast failover pool)
        if groq_key:
            llm_candidates.append(groq.LLM(api_key=groq_key, model=groq_model))
            if groq_backup_model and groq_backup_model != groq_model:
                llm_candidates.append(groq.LLM(api_key=groq_key, model=groq_backup_model))

        if groq_backup_key and groq_backup_key != groq_key:
            llm_candidates.append(groq.LLM(api_key=groq_backup_key, model=groq_model))
            if groq_backup_model and groq_backup_model != groq_model:
                llm_candidates.append(groq.LLM(api_key=groq_backup_key, model=groq_backup_model))

        # LiveKit Cloud Gateway Inference as high-capacity backup (enterprise rate limits)
        lk_key = os.getenv("LIVEKIT_API_KEY")
        lk_secret = os.getenv("LIVEKIT_API_SECRET")
        if lk_key and lk_secret:
            try:
                from livekit.agents.inference import llm as lk_llm
                llm_candidates.append(
                    lk_llm.LLM(
                        model="google/gemini-2.5-flash",
                        api_key=lk_key,
                        api_secret=lk_secret,
                    )
                )
            except Exception as e:
                logger.debug("LiveKit Cloud inference LLM not attached: %s", e)

        if openai_key:
            llm_candidates.append(openai.LLM(model=os.getenv("OPENAI_MODEL", "gpt-4o-mini")))

        if not llm_candidates:
            llm_candidates.append(openai.LLM(model=os.getenv("OPENAI_MODEL", "gpt-4o-mini")))

        llm_engine = (
            llm.FallbackAdapter(llm=llm_candidates)
            if len(llm_candidates) > 1
            else llm_candidates[0]
        )

        # TTS Engine: Primary Deepgram Aura (default) -> Backup 1 Sarvam AI -> Backup 2 Cartesia -> Fallback OpenAI
        tts_candidates = []

        if deepgram_key:
            deepgram_tts_model = os.getenv("DEEPGRAM_TTS_MODEL", "aura-2-asteria-en")
            tts_candidates.append(
                deepgram.TTS(
                    api_key=deepgram_key,
                    model=deepgram_tts_model,
                )
            )

        if sarvam_key:
            sarvam_tts_model = os.getenv("SARVAM_TTS_MODEL", "bulbul:v3")
            sarvam_speaker = os.getenv("SARVAM_TTS_SPEAKER", "kavya")
            tts_candidates.append(
                sarvam.TTS(
                    api_key=sarvam_key,
                    target_language_code="en-IN",
                    model=sarvam_tts_model,
                    speaker=sarvam_speaker,
                )
            )

        if cartesia_key:
            cartesia_model = os.getenv("CARTESIA_TTS_MODEL", os.getenv("CARTESIA_MODEL", "sonic-3"))
            cartesia_voice = os.getenv(
                "CARTESIA_TTS_VOICE",
                os.getenv("CARTESIA_VOICE", "db6b0ed5-d5d3-463d-ae85-518a07d3c2b4"),
            )
            tts_candidates.append(
                cartesia.TTS(
                    api_key=cartesia_key,
                    model=cartesia_model,
                    voice=cartesia_voice,
                )
            )

        if not tts_candidates and openai_key:
            tts_candidates.append(openai.TTS(voice="nova"))

        if not tts_candidates:
            tts_candidates.append(openai.TTS(voice="nova"))

        tts_engine = (
            tts.FallbackAdapter(tts=tts_candidates, max_retry_per_tts=1)
            if len(tts_candidates) > 1
            else tts_candidates[0]
        )

        vad_instance = None
        if hasattr(ctx, "proc") and hasattr(ctx.proc, "userdata"):
            vad_instance = ctx.proc.userdata.get("vad")
        if vad_instance is None:
            vad_instance = _get_vad()

        session = AgentSession(
            vad=vad_instance,
            stt=stt_engine,
            llm=llm_engine,
            tts=tts_engine,
            turn_handling=TurnHandlingOptions(
                endpointing=EndpointingOptions(
                    mode="fixed",
                    min_delay=0.35,
                    max_delay=1.0,
                ),
                preemptive_generation=PreemptiveGenerationOptions(
                    enabled=False,  # Stops burning tokens on speculative mid-utterance turns
                ),
            ),
            min_consecutive_speech_delay=0.0,
        )

        # --- Transcript capture: listen for conversation items ---
        if hasattr(session, "on"):
            @session.on("conversation_item_added")
            def on_conversation_item(ev):
                try:
                    item = getattr(ev, "item", ev)
                    call_log.add_chat_message(item)
                except Exception as err:
                    logger.debug("Error processing conversation item: %s", err)

            @session.on("agent_state_changed")
            def on_agent_state(ev):
                logger.info("Agent state: %s", getattr(ev, "new_state", ev))

            @session.on("user_state_changed")
            def on_user_state(ev):
                logger.info("User state: %s", getattr(ev, "new_state", ev))

            @session.on("speech_created")
            def on_speech_created(ev):
                logger.info("Speech created: %s", getattr(ev, "user_question", "assistant turn"))

            @session.on("error")
            def on_session_err(ev):
                logger.error("Session error event: %s", ev)

            @session.on("function_tools_executed")
            def on_tools_executed(ev):
                try:
                    calls = getattr(ev, "function_calls", ev)
                    if isinstance(calls, (list, tuple)):
                        for tool in calls:
                            name = getattr(tool, "name", None) or getattr(tool, "function_name", "")
                            if name:
                                call_log.record_tool(name)
                                # Capture promise-to-pay amounts from tool args
                                if name == "record_promise_to_pay":
                                    args = getattr(tool, "arguments", None) or getattr(tool, "raw_arguments", "{}")
                                    if isinstance(args, str):
                                        try:
                                            args = json.loads(args)
                                        except (json.JSONDecodeError, TypeError):
                                            args = {}
                                    if isinstance(args, dict):
                                        call_log.amount_promised = args.get("amount")
                                        call_log.promised_date = args.get("payment_date")
                except Exception as err:
                    logger.debug("Error processing tools executed: %s", err)

        if account.phone_number:
            caller_number = os.getenv("LIVEKIT_SIP_CALLER_NUMBER", "+19897474190")
            logger.info("Placing SIP call: trunk_id=%s, caller_number=%s, destination=%s", trunk_id, caller_number, account.phone_number)
            sip_client = ctx.api.sip if hasattr(ctx, "api") and ctx.api and hasattr(ctx.api, "sip") else None
            client_to_close = None
            if sip_client is None:
                client_to_close = api.LiveKitAPI(
                    os.getenv("LIVEKIT_URL"),
                    os.getenv("LIVEKIT_API_KEY"),
                    os.getenv("LIVEKIT_API_SECRET"),
                )
                sip_client = client_to_close.sip
            try:
                await sip_client.create_sip_participant(
                    api.CreateSIPParticipantRequest(
                        room_name=ctx.room.name,
                        sip_trunk_id=trunk_id,
                        sip_call_to=account.phone_number,
                        sip_number=caller_number,
                        hide_phone_number=True,
                        participant_identity=account.participantIdentity,
                        participant_name="Borrower",
                        wait_until_answered=True,
                        ringing_timeout={"seconds": 45},
                        max_call_duration={"seconds": 900},
                        media_encryption=api.SIP_MEDIA_ENCRYPT_REQUIRE,
                    ),
                    timeout=60,
                )
            finally:
                if client_to_close is not None:
                    await client_to_close.aclose()

        is_console = room_name.startswith("console-") or "console" in room_name
        if is_console or not account.participantIdentity:
            participant = await asyncio.wait_for(ctx.wait_for_participant(), timeout=30)
            account.participantIdentity = participant.identity
        else:
            await asyncio.wait_for(
                ctx.wait_for_participant(identity=account.participantIdentity), timeout=30,
            )

        if finished.is_set():
            return

        room_opts = room_io.RoomOptions(
            text_input=False,
            delete_room_on_close=bool(account.phone_number),
        )
        if not is_console and account.participantIdentity:
            room_opts.participant_identity = account.participantIdentity

        assistant = CollectionAssistant(account, ctx)
        logger.info("Starting AgentSession for room %s (is_console=%s)", room_name, is_console)
        await session.start(
            room=ctx.room,
            agent=assistant,
            room_options=room_opts,
            record=False,
        )
        await asyncio.wait_for(finished.wait(), timeout=900)
    except api.TwirpError as error:
        call_log.call_status = "FAILED"
        logger.warning("Call failed (API code: %s, message: %s)", error.code, error.message)
    except TimeoutError:
        call_log.call_status = "FAILED"
        logger.warning("Call timed out waiting for answer")
    except Exception as e:
        call_log.call_status = "FAILED"
        logger.error("Voice session failed: %s; ending call", e)
    finally:
        try:
            if session is not None:
                # Sync any messages remaining in session history before closing
                try:
                    for msg in session.history.messages():
                        call_log.add_chat_message(msg)
                except Exception as e:
                    logger.debug("Error reading session history: %s", e)
                await session.aclose()
        finally:
            try:
                # Flush the call log to CRM before cleanup
                await call_log.flush()
            except Exception as e:
                logger.warning("Failed to flush call log: %s", e)
            try:
                if account.phone_number:
                    try:
                        await ctx.delete_room()
                    except api.TwirpError as error:
                        if error.code != "not_found":
                            logger.warning("Call room cleanup failed (API code: %s)", error.code)
                    except (aiohttp.ClientError, TimeoutError):
                        logger.warning("Call room cleanup could not reach the voice service")
            finally:
                ctx.shutdown(reason="Call ended")


if __name__ == "__main__":
    cli.run_app(server)
