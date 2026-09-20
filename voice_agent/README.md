# AI Collection Voice Agent (LiveKit Worker)

Real-time voice agent built with LiveKit Agents for empathetic, compliant debt recovery, payment negotiation, and promise-to-pay logging.

## Setup & Running

1. Run with `uv` (recommended):
   ```bash
   uv run python agent.py dev
   # Or from repository root:
   ./start.sh agent
   ```

   Alternatively, standard Python venv:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   python agent.py dev
   ```

2. Copy `.env.example` to `.env` and fill in your keys:
   ```bash
   cp .env.example .env
   ```

## Twilio outbound calls

1. In Twilio, create an **Elastic SIP Trunk**, associate your voice-capable number, set its Termination URI, and attach a Credential List. Enable the destination country in Twilio's dialing permissions. Trial accounts may restrict destinations to verified numbers.
2. In LiveKit Cloud, create an **outbound SIP trunk** using that Termination URI as its address, the Twilio number in E.164 format as its caller number, and the Credential List username/password. These are SIP credentials, not your Twilio Account SID/Auth Token. See [Twilio trunk setup](https://docs.livekit.io/sip/quickstarts/configuring-twilio-trunk/).
3. Set `LIVEKIT_SIP_OUTBOUND_TRUNK_ID` to the resulting **LiveKit** trunk ID (`ST_...`) in `agent/.env`. Configure `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `OPENAI_API_KEY` for the same project. Leave `DEEPGRAM_API_KEY` empty to use OpenAI transcription. Self-hosted installations also need the separate LiveKit SIP service.
4. For CRM writes, generate a random secret with `python -c 'import secrets; print(secrets.token_urlsafe(32))'` and set the same `CRM_AGENT_API_KEY` in `agent/.env` and `crm/.env.local`. Restart both services. Use HTTPS for `CRM_API_BASE` outside a trusted local network. Docker Compose reads the root `.env` and forwards the shared key.
5. Install the pinned dependencies, run `python agent.py download-files`, then `python agent.py dev`. Authenticate the LiveKit CLI to the same project.
6. Dispatch one call with the CLI below. Replace the fictional number with your own authorized test number and use actual CRM account data. **Executing this command places a billable call.**

```bash
lk dispatch create --new-room --agent-name recovra-collection-agent --metadata '{"phone_number":"+12025550123","accountId":"test-account","debtorName":"Test Borrower","originalCreditor":"Test Creditor","currentBalance":1000,"daysPastDue":30,"maxDiscountPercent":20}'
```

Only trusted server-side callers should create dispatches. Account context comes from dispatch metadata, never browser-controlled participant metadata. Missing or invalid account context prevents dialing. The worker waits for the answer before speaking, limits ringing to 45 seconds and calls to 15 minutes, and deletes the call room on exit. There are no automatic retries.

For a browser session, dispatch the same account context without `phone_number` and join that room with identity `borrower` (or set `participantIdentity` to your chosen identity). Automatic unnamed dispatch is no longer used.

The CRM dashboard does not yet initiate these dispatches or persist call lifecycle/transcripts. Promise-to-pay, plan, and hardship tools sync through the existing CRM endpoints. They confirm success only after a successful response. These endpoints authenticate workers or signed-in users; existing shared CRM collections still need tenant isolation before multi-tenant production use.

Recording is disabled. Voicemail/wrong-number handling is prompt-guided, not carrier-level answering-machine detection. Verify consent, calling hours, suppression rules, identity verification, and applicable collection disclosures before calling borrowers; this integration does not implement those policy checks.

## Verification

```bash
PYTHON_DOTENV_DISABLED=1 python -m unittest discover -s agent -p 'test_*.py'
npm --prefix crm run lint -- --incremental false
```

Run verification from the repository root with the worker dependencies installed. Tests mock providers and CRM responses; they never place calls or write CRM records. Warning messages in negative tests are expected. A live authorized test call is still required to verify carrier routing, audio, and credentials.
