import asyncio
import importlib.util
import json
import os
from pathlib import Path
import socket
import sys
import unittest
from datetime import date
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, Mock, patch

from pydantic import ValidationError


AGENT_DIR = Path(__file__).resolve().parent
with patch.dict(os.environ, {"PYTHON_DOTENV_DISABLED": "1"}, clear=True):
    with patch.object(sys, "path", [str(AGENT_DIR), *sys.path]):
        spec = importlib.util.spec_from_file_location("recovra_test_worker", AGENT_DIR / "agent.py")
        worker = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(worker)


ACCOUNT = {
    "accountId": "test-account",
    "debtorName": "Test Borrower",
    "originalCreditor": "Test Creditor",
    "currentBalance": 1000,
    "daysPastDue": 30,
    "maxDiscountPercent": 20,
}


class CallContextTests(unittest.TestCase):
    def test_defaults_and_boundaries(self):
        account = worker.CallContext.model_validate(ACCOUNT)
        self.assertEqual(account.participantIdentity, "borrower")
        self.assertIsNone(account.phone_number)
        for discount in (0, 100):
            with self.subTest(discount=discount):
                account = worker.CallContext.model_validate({
                    **ACCOUNT, "currentBalance": 0, "daysPastDue": 0,
                    "maxDiscountPercent": discount,
                    "phone_number": "+15555550100", "participantIdentity": "test-borrower",
                })
                self.assertEqual(account.maxDiscountPercent, discount)
                self.assertEqual(account.participantIdentity, "test-borrower")

    def test_legacy_aliases(self):
        legacy = dict(ACCOUNT)
        legacy["balance"] = legacy.pop("currentBalance")
        legacy["maxDiscount"] = legacy.pop("maxDiscountPercent")
        self.assertEqual(
            worker.CallContext.model_validate(legacy),
            worker.CallContext.model_validate(ACCOUNT),
        )

    def test_canonical_fields_take_precedence_over_aliases(self):
        account = worker.CallContext.model_validate({**ACCOUNT, "balance": 9999, "maxDiscount": 100})
        self.assertEqual(account.currentBalance, 1000)
        self.assertEqual(account.maxDiscountPercent, 20)

    def test_each_required_field_is_required(self):
        for field in ACCOUNT:
            with self.subTest(field=field):
                metadata = dict(ACCOUNT)
                del metadata[field]
                with self.assertRaises(ValidationError):
                    worker.CallContext.model_validate(metadata)

    def test_invalid_metadata(self):
        invalid = {
            "accountId": ("", "a" * 101, None),
            "debtorName": ("", "a" * 201),
            "originalCreditor": ("", "a" * 201),
            "currentBalance": (-1, float("nan"), float("inf"), float("-inf")),
            "daysPastDue": (-1, 1.5),
            "maxDiscountPercent": (-1, 101, float("nan"), float("inf")),
            "phone_number": ("", "15555550100", "+05555550100", "+123", "+" + "1" * 16),
            "participantIdentity": ("", "a" * 101),
        }
        for field, values in invalid.items():
            for value in values:
                with self.subTest(field=field, value=value):
                    with self.assertRaises(ValidationError):
                        worker.CallContext.model_validate({**ACCOUNT, field: value})


class IsolatedWorkerTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.enterContext(patch.dict(os.environ, {
            "PYTHON_DOTENV_DISABLED": "1",
            "OPENAI_API_KEY": "test-only-not-a-key",
            "CRM_AGENT_API_KEY": "test-only-not-a-key",
            "LIVEKIT_SIP_OUTBOUND_TRUNK_ID": "test-trunk",
        }, clear=True))
        self.enterContext(patch.object(socket.socket, "connect", side_effect=AssertionError("Network forbidden")))
        self.enterContext(patch.object(socket.socket, "connect_ex", side_effect=AssertionError("Network forbidden")))
        self.enterContext(patch.object(socket, "getaddrinfo", side_effect=AssertionError("DNS forbidden")))


class AssistantTests(IsolatedWorkerTests):
    def setUp(self):
        super().setUp()
        self.assistant = worker.CollectionAssistant(worker.CallContext.model_validate(ACCOUNT), Mock())
        self.client_factory = self.enterContext(patch.object(worker.aiohttp, "ClientSession"))
        self.client = self.client_factory.return_value.__aenter__.return_value
        self.response = MagicMock()
        self.response.json = AsyncMock(return_value={"success": True, "account": {"id": "test-account"}})
        self.client.post = Mock()
        self.client.post.return_value.__aenter__ = AsyncMock(return_value=self.response)
        self.client.post.return_value.__aexit__ = AsyncMock(return_value=False)

    async def test_discount_cap_and_rounding(self):
        for discount, payoff in ((0, "$1,000.00"), (20, "$800.00"), (12.345, "$876.55")):
            with self.subTest(discount=discount):
                self.assertIn(payoff, await self.assistant.calculate_settlement_discount(discount))
        for discount in (-1, 20.01, 100, float("nan"), float("inf"), float("-inf")):
            with self.subTest(discount=discount):
                result = await self.assistant.calculate_settlement_discount(discount)
                self.assertIn("Discount must be between 0 and 20.0%", result)
                self.assertNotIn("Authorized payoff", result)
        self.client_factory.assert_not_called()

    async def test_zero_discount_cap(self):
        self.assistant.account.maxDiscountPercent = 0
        self.assertIn("$1,000.00", await self.assistant.calculate_settlement_discount(0))
        self.assertNotIn("Authorized payoff", await self.assistant.calculate_settlement_discount(0.01))

    async def test_crm_success_request_options(self):
        self.assertTrue(await self.assistant.sync_crm("test-path", {"amount": 10}))
        kwargs = self.client_factory.call_args.kwargs
        self.assertEqual(kwargs["timeout"].total, 10)
        self.assertEqual(kwargs["headers"], {"Authorization": "Bearer test-only-not-a-key"})
        self.client.post.assert_called_once_with(
            f"{worker.CRM_API_BASE}/test-path", json={"amount": 10}, allow_redirects=False,
        )
        self.response.raise_for_status.assert_called_once_with()

    async def test_missing_crm_key_never_opens_client(self):
        del os.environ["CRM_AGENT_API_KEY"]
        self.assertFalse(await self.assistant.sync_crm("test-path", {}))
        self.client_factory.assert_not_called()

    async def test_crm_rejects_unsuccessful_or_incomplete_responses(self):
        for result in ({}, {"success": False, "account": {"id": "x"}},
                       {"success": 1, "account": {"id": "x"}},
                       {"success": True}, {"success": True, "account": None},
                       {"success": True, "account": {}}):
            with self.subTest(result=result):
                self.response.json.return_value = result
                self.assertFalse(await self.assistant.sync_crm("test-path", {}))

    async def test_crm_http_error_returns_false_without_reading_body(self):
        self.response.raise_for_status.side_effect = worker.aiohttp.ClientResponseError(
            Mock(), (), status=503, message="test unavailable",
        )
        self.assertFalse(await self.assistant.sync_crm("test-path", {}))
        self.response.json.assert_not_awaited()

    async def test_crm_transport_and_timeout_failures(self):
        for error in (worker.aiohttp.ClientConnectionError("test offline"), TimeoutError()):
            with self.subTest(error=type(error).__name__):
                self.client.post.side_effect = error
                self.assertFalse(await self.assistant.sync_crm("test-path", {}))

    async def test_crm_invalid_json_returns_false(self):
        self.response.json.side_effect = ValueError("invalid JSON")
        self.assertFalse(await self.assistant.sync_crm("test-path", {}))

    async def test_crm_non_object_json_returns_false(self):
        for result in (None, [], "unavailable"):
            with self.subTest(result=result):
                self.response.json.return_value = result
                self.assertFalse(await self.assistant.sync_crm("test-path", {}))

    async def test_failed_crm_writes_are_not_confirmed(self):
        self.response.raise_for_status.side_effect = worker.aiohttp.ClientError("test failure")
        today = date.today().isoformat()
        results = (
            await self.assistant.record_promise_to_pay(100, today),
            await self.assistant.setup_installment_plan(100, 10, today),
            await self.assistant.log_dispute_or_hardship("DISPUTE_AMOUNT", "Test dispute"),
        )
        for result in results:
            with self.subTest(result=result):
                self.assertIn("Could not save", result)
                self.assertIn("Do not claim", result)
        self.assertEqual(self.client.post.call_count, 3)

    async def test_successful_crm_tools_send_expected_payloads(self):
        today = date.today().isoformat()
        self.assistant.account.accountId = "test/id with space"
        sync = self.enterContext(patch.object(self.assistant, "sync_crm", new_callable=AsyncMock, return_value=True))
        self.assertEqual(await self.assistant.record_promise_to_pay(100, today), "Promise to pay saved.")
        sync.assert_awaited_with("calls/promise-to-pay", {
            "accountId": "test/id with space", "amount": 100, "date": today, "method": "Online Portal",
        })
        self.assertEqual(await self.assistant.setup_installment_plan(100, 10, today), "Payment plan saved.")
        sync.assert_awaited_with("accounts/test%2Fid%20with%20space/plan", {
            "monthlyAmount": 100, "months": 10, "startDate": today, "total": 1000,
        })
        self.assertEqual(await self.assistant.log_dispute_or_hardship("DISPUTE_AMOUNT", "Test"), "Account flagged for review.")
        sync.assert_awaited_with("accounts/test%2Fid%20with%20space/flag", {"category": "DISPUTE_AMOUNT", "notes": "Test"})


class EntrypointTests(IsolatedWorkerTests):
    def setUp(self):
        super().setUp()
        self.metadata = {**ACCOUNT, "phone_number": "+15555550100", "participantIdentity": "test-borrower"}
        self.events = {}
        self.room = SimpleNamespace(name="test-room", on=self.on)
        self.ctx = SimpleNamespace(
            job=SimpleNamespace(metadata=json.dumps(self.metadata)),
            room=self.room,
            connect=AsyncMock(),
            wait_for_participant=AsyncMock(return_value=SimpleNamespace(identity="test-borrower")),
            api=SimpleNamespace(sip=SimpleNamespace(create_sip_participant=AsyncMock())),
            delete_room=AsyncMock(),
            shutdown=Mock(),
        )
        self.sip = self.ctx.api.sip.create_sip_participant
        self.session = SimpleNamespace(start=AsyncMock(), say=AsyncMock(side_effect=self.finish), aclose=AsyncMock())
        self.session_factory = self.enterContext(patch.object(worker, "AgentSession", return_value=self.session))
        self.vad = self.enterContext(patch.object(worker.silero.VAD, "load"))
        self.openai_stt = self.enterContext(patch.object(worker.openai, "STT"))
        self.deepgram_stt = self.enterContext(patch.object(worker.deepgram, "STT"))
        self.llm = self.enterContext(patch.object(worker.openai, "LLM"))
        self.tts = self.enterContext(patch.object(worker.openai, "TTS"))
        self.real_wait_for = asyncio.wait_for
        self.wait_for = self.enterContext(patch.object(worker.asyncio, "wait_for", side_effect=self.bounded_wait))

    def on(self, event):
        def register(callback):
            self.events[event] = callback
            return callback
        return register

    async def bounded_wait(self, awaitable, timeout):
        return await self.real_wait_for(awaitable, timeout=min(timeout, 1))

    async def finish(self, text):
        self.events["participant_disconnected"](SimpleNamespace(identity="test-borrower"))

    def isolated_greeting(self):
        self.enterContext(patch.object(worker, "GREETING_TEMPLATE", "Hello {debtor_name}."))

    def assert_ended(self, outbound=True):
        self.session.aclose.assert_awaited_once_with()
        if outbound:
            self.ctx.delete_room.assert_awaited_once_with()
        else:
            self.ctx.delete_room.assert_not_awaited()
        self.ctx.shutdown.assert_called_once_with(reason="Call ended")

    async def test_real_greeting_is_spoken_after_answer(self):
        await worker.entrypoint(self.ctx)
        self.sip.assert_awaited_once()
        self.session.start.assert_awaited_once()
        self.assert_ended()
        self.session.say.assert_awaited_once()
        self.assertIn(ACCOUNT["debtorName"], self.session.say.call_args.args[0])

    async def test_outbound_request_answer_order_identity_and_timeouts(self):
        self.isolated_greeting()
        entered = asyncio.Event()
        answered = asyncio.Event()
        participant_ready = asyncio.Event()

        async def dial(request, timeout):
            entered.set()
            await answered.wait()

        async def participant(identity):
            self.assertTrue(answered.is_set())
            self.session.start.assert_not_awaited()
            self.session.say.assert_not_awaited()
            participant_ready.set()
            return SimpleNamespace(identity=identity)

        async def start(**kwargs):
            self.assertTrue(participant_ready.is_set())

        async def say(text):
            self.session.start.assert_awaited_once()
            self.assertTrue(answered.is_set())
            await self.finish(text)

        self.sip.side_effect = dial
        self.ctx.wait_for_participant.side_effect = participant
        self.session.start.side_effect = start
        self.session.say.side_effect = say
        task = asyncio.create_task(worker.entrypoint(self.ctx))
        try:
            await self.real_wait_for(entered.wait(), 1)
            self.session.start.assert_not_awaited()
            self.session.say.assert_not_awaited()
            self.ctx.wait_for_participant.assert_not_awaited()
            answered.set()
            await self.real_wait_for(task, 2)
        finally:
            if not task.done():
                task.cancel()
                await asyncio.gather(task, return_exceptions=True)
        self.ctx.connect.assert_awaited_once_with(auto_subscribe=worker.AutoSubscribe.AUDIO_ONLY)
        self.sip.assert_awaited_once()
        request = self.sip.call_args.args[0]
        self.assertIsInstance(request, worker.api.CreateSIPParticipantRequest)
        self.assertEqual(request.room_name, "test-room")
        self.assertEqual(request.sip_trunk_id, "test-trunk")
        self.assertEqual(request.sip_call_to, "+15555550100")
        self.assertEqual(request.participant_identity, "test-borrower")
        self.assertEqual(request.participant_name, "Borrower")
        self.assertTrue(request.wait_until_answered)
        self.assertTrue(request.hide_phone_number)
        self.assertEqual(request.ringing_timeout.seconds, 45)
        self.assertEqual(request.max_call_duration.seconds, 900)
        self.assertEqual(self.sip.call_args.kwargs, {"timeout": 60})
        self.ctx.wait_for_participant.assert_awaited_once_with(identity="test-borrower")
        self.assertEqual([call.kwargs["timeout"] for call in self.wait_for.call_args_list], [30, 900])
        options = self.session.start.call_args.kwargs
        self.assertIs(options["room"], self.room)
        self.assertIsInstance(options["agent"], worker.CollectionAssistant)
        self.assertEqual(options["room_options"].participant_identity, "test-borrower")
        self.assertIs(options["room_options"].text_input, False)
        self.assertTrue(options["room_options"].delete_room_on_close)
        self.assertIs(options["record"], False)
        self.session.say.assert_awaited_once_with("Hello Test Borrower.")
        self.assert_ended()

    async def test_sip_failure_closes_session_and_deletes_room_without_greeting(self):
        self.sip.side_effect = worker.api.TwirpError("unavailable", "test SIP failure", status=503)
        await worker.entrypoint(self.ctx)
        self.ctx.wait_for_participant.assert_not_awaited()
        self.session.start.assert_not_awaited()
        self.session.say.assert_not_awaited()
        self.assert_ended()

    async def test_sip_timeout_cleans_up_without_greeting(self):
        self.sip.side_effect = TimeoutError()
        await worker.entrypoint(self.ctx)
        self.ctx.wait_for_participant.assert_not_awaited()
        self.session.say.assert_not_awaited()
        self.assert_ended()

    async def test_participant_timeout_cleans_up_without_start_or_greeting(self):
        self.ctx.wait_for_participant.side_effect = TimeoutError()
        await worker.entrypoint(self.ctx)
        self.session.start.assert_not_awaited()
        self.session.say.assert_not_awaited()
        self.assertEqual(self.wait_for.call_args.kwargs["timeout"], 30)
        self.assert_ended()

    async def test_disconnect_before_session_start_does_not_greet(self):
        async def participant(identity):
            self.events["participant_disconnected"](SimpleNamespace(identity=identity))
            return SimpleNamespace(identity=identity)
        self.ctx.wait_for_participant.side_effect = participant
        await worker.entrypoint(self.ctx)
        self.session.start.assert_not_awaited()
        self.session.say.assert_not_awaited()
        self.assert_ended()

    async def test_other_participant_disconnect_does_not_end_call(self):
        self.isolated_greeting()
        async def participant(identity):
            self.events["participant_disconnected"](SimpleNamespace(identity="observer"))
            return SimpleNamespace(identity=identity)
        self.ctx.wait_for_participant.side_effect = participant
        await worker.entrypoint(self.ctx)
        self.session.say.assert_awaited_once()
        self.assert_ended()

    async def test_room_disconnect_ends_call(self):
        self.isolated_greeting()
        async def say(text):
            self.events["disconnected"]("test room closed")
        self.session.say.side_effect = say
        await worker.entrypoint(self.ctx)
        self.session.say.assert_awaited_once()
        self.assert_ended()

    async def test_call_duration_timeout_cleans_up(self):
        self.isolated_greeting()
        async def wait(awaitable, timeout):
            if timeout == 900:
                awaitable.close()
                raise TimeoutError()
            return await self.bounded_wait(awaitable, timeout)
        self.wait_for.side_effect = wait
        self.session.say.side_effect = None
        await worker.entrypoint(self.ctx)
        self.session.say.assert_awaited_once()
        self.assert_ended()

    async def test_deleted_sip_room_cleanup_still_shuts_down(self):
        self.sip.side_effect = worker.api.TwirpError("unavailable", "test SIP failure", status=503)
        self.ctx.delete_room.side_effect = worker.api.TwirpError("not_found", "test room gone", status=404)
        await worker.entrypoint(self.ctx)
        self.assert_ended()

    async def test_missing_trunk_never_dials(self):
        del os.environ["LIVEKIT_SIP_OUTBOUND_TRUNK_ID"]
        await worker.entrypoint(self.ctx)
        self.sip.assert_not_awaited()
        self.ctx.connect.assert_not_awaited()
        self.session_factory.assert_not_called()
        self.ctx.shutdown.assert_called_once_with(reason="Invalid call configuration")

    async def test_missing_provider_key_never_dials(self):
        del os.environ["OPENAI_API_KEY"]
        await worker.entrypoint(self.ctx)
        self.sip.assert_not_awaited()
        self.ctx.connect.assert_not_awaited()
        self.ctx.shutdown.assert_called_once_with(reason="Invalid call configuration")

    async def test_missing_or_invalid_metadata_never_dials(self):
        for metadata in (None, "", "{}", "null", "[]", "{invalid", json.dumps({"accountId": "test"})):
            with self.subTest(metadata=metadata):
                self.ctx.job.metadata = metadata
                self.ctx.shutdown.reset_mock()
                await worker.entrypoint(self.ctx)
                self.sip.assert_not_awaited()
                self.ctx.connect.assert_not_awaited()
                self.session_factory.assert_not_called()
                self.ctx.shutdown.assert_called_once_with(reason="Invalid call configuration")

    async def test_browser_path_never_uses_sip_or_deletes_room(self):
        self.isolated_greeting()
        del os.environ["LIVEKIT_SIP_OUTBOUND_TRUNK_ID"]
        self.ctx.job.metadata = json.dumps(ACCOUNT)
        async def say(text):
            self.events["participant_disconnected"](SimpleNamespace(identity="borrower"))
        self.session.say.side_effect = say
        await worker.entrypoint(self.ctx)
        self.sip.assert_not_awaited()
        self.ctx.wait_for_participant.assert_awaited_once_with(identity="borrower")
        self.session.start.assert_awaited_once()
        options = self.session.start.call_args.kwargs["room_options"]
        self.assertEqual(options.participant_identity, "borrower")
        self.assertFalse(options.delete_room_on_close)
        self.session.say.assert_awaited_once_with("Hello Test Borrower.")
        self.openai_stt.assert_called_once_with()
        self.deepgram_stt.assert_not_called()
        self.assert_ended(outbound=False)

    async def test_deepgram_provider_is_selected_when_configured(self):
        self.isolated_greeting()
        os.environ["DEEPGRAM_API_KEY"] = "test-only-not-a-key"
        await worker.entrypoint(self.ctx)
        self.deepgram_stt.assert_called_once_with()
        self.openai_stt.assert_not_called()
        self.assertIs(self.session_factory.call_args.kwargs["stt"], self.deepgram_stt.return_value)
        self.assert_ended()


if __name__ == "__main__":
    unittest.main()
