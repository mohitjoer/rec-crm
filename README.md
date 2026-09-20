# Recovra — Autonomous Voice Agents & Financial Recovery CRM

<div align="center">

![Recovra Platform](https://img.shields.io/badge/Platform-Recovra%20CRM-blue?style=for-the-badge)
![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)
![React 19](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Python 3.12+](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![LiveKit Agents](https://img.shields.io/badge/LiveKit-Agents%20SDK-ff5c5c?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![MCP Server](https://img.shields.io/badge/MCP-Protocol-purple?style=for-the-badge)

<p align="center">
  <b>An end-to-end intelligent debt collection and financial recovery platform combining empathetic real-time AI voice agents, comprehensive portfolio CRM ledger, multi-model LLM/STT/TTS failover, and automated recovery workflows.</b>
</p>

[Key Features](#key-features) • [System Architecture](#system-architecture) • [Getting Started](#getting-started) • [Environment Configuration](#environment-configuration) • [Voice Agent Setup](#voice-agent--telephony) • [MCP Server](#model-context-protocol-mcp-server) • [Scripts & Operations](#scripts--operations)

</div>

---

## Overview

**Recovra** is an enterprise-grade debt recovery platform designed for modern financial organizations, credit issuers, and recovery agencies. It replaces rigid IVR trees and high-stress manual call centers with an empathetic, compliant AI voice agent backed by a real-time portfolio management CRM.

### Why Recovra?
- **Empathetic & Compliant**: Automatically conducts identity verification, Mini-Miranda disclosures, hardship assessments, and settlement negotiations while adhering to collection policies.
- **Sub-Second Voice Latency**: Built with LiveKit Agents, Silero Voice Activity Detection (VAD), and ultra-fast inference backends (Deepgram, Gemini 3.5 Flash Lite, Groq LPUs, Cartesia, Sarvam AI).
- **Zero-Downtime Multi-Model Failover**: Intelligent multi-tiered fallbacks ensure calls never drop due to provider outages or rate limits.
- **Centralized CRM & Telemetry**: Full visibility into aging buckets, promise-to-pay (PTP) commitments, verbatim transcripts, sentiment tracking, and automated retry queues.
- **AI-Native MCP Connectivity**: Native Model Context Protocol (MCP) server allows AI assistants (Antigravity IDE, Claude, Cursor) to directly query portfolios and debtor telemetry.

---

## Key Features

### 🎙️ Autonomous Voice Agent (`/voice_agent`)
- **Real-Time Conversational Audio**: WebRTC browser audio and PSTN/SIP outbound calling via LiveKit and Twilio Elastic SIP Trunks.
- **Multi-Provider Fallback Pipeline**:
  - **Speech-to-Text (STT)**: Deepgram Nova-3 (Primary) $\rightarrow$ Sarvam AI `saaras:v3` (Indian accents) $\rightarrow$ OpenAI Whisper.
  - **LLM Engine**: Google Gemini `gemini-3.5-flash-lite` (Primary) $\rightarrow$ Groq LPU `qwen/qwen3.8-27b` / `gpt-oss-120b` (Backup) $\rightarrow$ LiveKit Cloud Inference $\rightarrow$ OpenAI `gpt-4o-mini`.
  - **Text-to-Speech (TTS)**: Deepgram Aura-2 `aura-2-asteria-en` (Primary) $\rightarrow$ Sarvam Bulbul `bulbul:v3` $\rightarrow$ Cartesia Sonic-3 $\rightarrow$ OpenAI Nova.
- **Real-Time CRM Tool Calling**:
  - `record_promise_to_pay`: Commits agreed payment amount, date, and method directly to the CRM ledger.
  - `calculate_settlement_discount`: Dynamically computes settlement payoffs within authorized discount caps.
  - `setup_installment_plan`: Structures multi-month installment schedules.
  - `log_dispute_or_hardship`: Flags accounts for dispute reviews, attorney representation, or financial hardship holds.
- **Turn-Taking & Interruption Handling**: Silero VAD allows borrowers to naturally interject without awkward agent pauses.
- **Telemetry Logger**: Records full speaker-attributed transcripts, sentiment classification, call duration, and Mini-Miranda compliance verification.

### 📊 Financial Recovery CRM (`/crm`)
- **Portfolio Analytics & Aging Buckets**: Real-time breakdown of Current, 30 DPD, 60 DPD, 90 DPD, and 120+ DPD (Charge-off) accounts, pre-due vs. overdue balances, and 30-day interaction trends.
- **Customer Ledger & Account Explorer**: Search, filter, and inspect accounts with risk scores, payment plans, promise-to-pay statuses, and audit notes.
- **Automated Recovery Queue**: Automatically tracks calls requiring reattempt (unanswered, voicemail, scheduled callbacks) with configurable retry intervals and attempt thresholds.
- **Audit Logs & Verbatim Transcripts**: Searchable call archive with audio simulation, sentiment indicators, and compliance metrics.
- **Inbound Ingestion Webhook**: Secure REST webhook (`/api/webhooks`) for billing engines and ERPs to stream debtor records and overdue invoices into Recovra.
- **Interactive Voice Sandbox**: Live in-browser WebRTC agent tester to simulate borrower calls without placing billable telephony calls.
- **Tenant & Authentication Layer**: Powered by Better Auth with MongoDB persistence.
- **Notification Engine**: SMTP integration (Nodemailer) for transactional receipts and payment schedule confirmations.

### 🤖 Model Context Protocol (MCP) Server (`/crm/mcp_server`)
- Exposes CRM ledgers and voice telemetry to LLMs via standard JSON-RPC protocol.
- Registered tools:
  - `get_dashboard_summary`: Portfolio totals, aging distributions, recovery rates, and compliance scores.
  - `get_customers`: Search and filter debtor accounts.
  - `get_customer_detail`: Comprehensive debtor dossier, notes history, and call transcripts.
  - `get_delinquency_and_aging`: Balance breakdowns by delinquency aging buckets.
  - `get_calls_and_telemetry`: Call logs, dispositions, sentiment, and verbatim dialog.
  - `get_recovery_queue`: Inspect the pending retry queue.

---

## System Architecture

```mermaid
flowchart TB
    subgraph Clients["Users & External Systems"]
        Admin[Recovery Agent / Manager]
        Borrower[Borrower / Customer]
        ERP[External Billing / ERP System]
        AI[AI Assistant / MCP Client]
    end

    subgraph RecovraPlatform["Recovra Platform"]
        subgraph NextCRM["Recovra CRM (Next.js 16)"]
            UI[Web Dashboard UI]
            API[REST API Endpoints]
            Webhooks[Webhook Ingestion]
            Auth[Better Auth & RBAC]
            MCPServer[MCP Server]
        end

        subgraph VoiceWorker["Voice Agent Worker (Python)"]
            Worker[LiveKit Agent Worker]
            VAD[Silero VAD]
            Tools[CRM Tools & Prompts]
            Router[Fallback Router]
        end

        subgraph Storage["Persistence"]
            Mongo[(MongoDB Atlas)]
        end
    end

    subgraph TelephonyCloud["Telephony & Realtime"]
        LiveKitCloud[LiveKit Cloud WebRTC]
        TwilioTrunk[Twilio SIP Trunk]
    end

    subgraph AIProviders["Multi-Model Inference Layer"]
        STT[Deepgram / Sarvam / OpenAI STT]
        LLM[Gemini Flash / Groq LPUs / OpenAI]
        TTS[Deepgram Aura / Sarvam / Cartesia]
    end

    %% Interactions
    Admin -->|Manage Accounts & Queue| UI
    ERP -->|POST Inbound Debtors| Webhooks
    AI <-->|Stdio JSON-RPC| MCPServer
    MCPServer <--> API
    UI <--> API
    API <--> Mongo
    Webhooks <--> Mongo

    Borrower <-->|PSTN Call| TwilioTrunk
    TwilioTrunk <-->|SIP| LiveKitCloud
    Admin <-->|WebRTC Voice Test| LiveKitCloud
    LiveKitCloud <--> Worker

    Worker --> VAD
    Worker --> Router
    Router --> STT
    Router --> LLM
    Router --> TTS
    Worker --> Tools
    Tools -->|Sync PTP, Plans & Transcripts| API
```

---

## Project Structure

```
rec-crm/
├── crm/                         # Next.js 16 SaaS Application & CRM
│   ├── app/                     # Next.js App Router (pages & API routes)
│   │   ├── (auth)/              # Authentication views
│   │   ├── accounts/            # Debtor ledger & profile details
│   │   ├── agent/               # In-browser WebRTC agent testing room
│   │   ├── api/                 # REST APIs (calls, accounts, queue, webhooks, health)
│   │   ├── dashboard/           # Analytics, aging charts, KPI trends
│   │   ├── database/            # MongoDB schema and collection inspector
│   │   ├── logs/                # Call audit logs & verbatim transcripts
│   │   ├── queue/               # Automated retry queue management
│   │   ├── settings/            # Agent prompts, branding, SMTP settings
│   │   └── webhooks/            # Webhook configuration & inbound logs
│   ├── components/              # Reusable UI components & Visx charts
│   ├── lib/                     # Database client, auth, types, LiveKit helpers
│   ├── mcp_server/              # Model Context Protocol (MCP) server
│   │   ├── server.js            # Node.js MCP server implementation
│   │   └── README.md            # MCP tool definitions & configs
│   ├── Dockerfile               # CRM production container definition
│   └── package.json
│
├── voice_agent/                 # LiveKit Autonomous Voice Agent Worker
│   ├── agent.py                 # Core agent logic, fallback pipelines & CRM tools
│   ├── prompts.py               # System prompts, debt negotiation policies & templates
│   ├── test_agent.py            # Comprehensive unit test suite (mocked providers)
│   ├── Dockerfile               # Voice agent container definition
│   ├── pyproject.toml           # uv / Python dependencies
│   └── requirements.txt         # Pinned pip requirements
│
├── scripts/                     # DevOps automation scripts
│   ├── start.sh                 # Start containerized stack
│   ├── stop.sh                  # Graceful container shutdown
│   ├── redeploy.sh              # Rebuild and restart services
│   ├── status.sh                # Inspect container health
│   ├── logs.sh                  # Stream container logs
│   ├── dev.sh                   # Start Next.js CRM dev server
│   ├── docker-up.sh             # Docker compose up helper
│   └── docker-down.sh           # Docker compose down helper
│
├── docker-compose.yml           # Unified multi-service deployment spec
├── start.sh                     # Primary platform CLI launcher
├── stop.sh                      # Top-level shutdown shortcut
├── status.sh                    # Top-level health check shortcut
├── logs.sh                      # Top-level log streamer shortcut
├── redeploy.sh                  # Top-level redeployment shortcut
├── .env.example                 # Master environment variable template
└── package.json                 # Workspace root scripts
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your host machine:
- **Docker** and **Docker Compose** (recommended for production and full-stack runtime)
- **Node.js 20+** and **npm**
- **Python 3.12+** with [uv](https://docs.astral.sh/uv/) (recommended for fast package management)
- **MongoDB** cluster (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **LiveKit Cloud** account ([cloud.livekit.io](https://cloud.livekit.io))

---

### Option 1: Full-Stack Docker Deployment (Recommended)

The easiest way to run the entire platform (CRM + Voice Agent) is using Docker Compose:

1. **Clone the repository**:
   ```bash
   git clone <repo-url> rec-crm
   cd rec-crm
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your LiveKit, MongoDB, and AI provider API credentials
   ```

3. **Launch the platform**:
   ```bash
   ./start.sh
   # Or explicitly:
   ./start.sh up
   ```

4. **Verify running services**:
   ```bash
   ./status.sh
   ```

   - **CRM Dashboard**: [http://localhost:3000](http://localhost:3000)
   - **CRM Health Endpoint**: [http://localhost:3000/api/health](http://localhost:3000/api/health)
   - **Voice Agent**: Automatically connects to LiveKit Cloud and CRM internal network.

5. **View real-time logs**:
   ```bash
   ./logs.sh
   ```

6. **Stop the stack**:
   ```bash
   ./stop.sh
   ```

---

### Option 2: Local Development (Hybrid Mode)

For active code development and hot-reloading:

#### 1. Setup & Run Next.js CRM
```bash
# Navigate to crm folder
cd crm

# Install dependencies
npm install

# Setup local environment
cp .env.local.example .env.local
# Set MONGODB_URI, LIVEKIT_*, CRM_AGENT_API_KEY, BETTER_AUTH_SECRET

# Run Next.js dev server
npm run dev
# Or from root: ./start.sh dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### 2. Setup & Run Voice Agent Worker
```bash
# Navigate to voice_agent folder
cd voice_agent

# Run with uv (fastest):
uv run python agent.py dev
# Or from root: ./start.sh agent

# Alternatively, using standard Python venv:
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python agent.py dev
```

---

## Environment Configuration

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

### Essential Configuration Variables

| Variable | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `LIVEKIT_URL` | **Yes** | WebRTC WebSocket URL for LiveKit Cloud or self-hosted server | `wss://project.livekit.cloud` |
| `LIVEKIT_API_KEY` | **Yes** | LiveKit Project API Key | `APId9...` |
| `LIVEKIT_API_SECRET` | **Yes** | LiveKit Project API Secret | `sec...` |
| `LIVEKIT_AGENT_NAME` | No | Name under which the voice worker registers | `recovra-collection-agent` |
| `CRM_AGENT_API_KEY` | **Yes** | Shared secret token authorizing voice worker writes to CRM API | `Generate with python -c 'import secrets; print(secrets.token_urlsafe(32))'` |
| `MONGODB_URI` | **Yes** | MongoDB Atlas or local connection string | `mongodb+srv://user:pwd@cluster.mongodb.net/collection_crm` |
| `BETTER_AUTH_SECRET` | **Yes** | Encryption secret for user session authentication | `Random 32-char string` |
| `BETTER_AUTH_URL` | No | Base application URL | `http://localhost:3000` |
| `PORT` | No | Port for Next.js CRM server | `3000` |

### AI Inference Providers (Speech & LLM)

| Variable | Provider | Purpose | Default Model |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini | **Primary LLM** (30 RPM, fast TTFT) | `gemini-3.5-flash-lite` |
| `GROQ_API_KEY` | Groq LPU | **Backup LLM** (Ultra-low latency failover) | `qwen/qwen3.8-27b` |
| `GROQ_BACKUP_MODEL` | Groq LPU | Secondary model on Groq | `openai/gpt-oss-120b` |
| `OPENAI_API_KEY` | OpenAI | **Fallback LLM / STT / TTS** | `gpt-4o-mini` |
| `DEEPGRAM_API_KEY` | Deepgram | **Primary STT & TTS** | STT: `nova-3`, TTS: `aura-2-asteria-en` |
| `SARVAM_API_KEY` | Sarvam AI | **Indian Accent STT / Bulbul TTS** | STT: `saaras:v3`, TTS: `bulbul:v3` (`kavya`) |
| `CARTESIA_API_KEY` | Cartesia | **Backup TTS** | `sonic-3` (`db6b0ed5...`) |

### Telephony & Email Configuration

| Variable | Purpose | Example |
| :--- | :--- | :--- |
| `LIVEKIT_SIP_OUTBOUND_TRUNK_ID` | LiveKit Outbound SIP Trunk ID (`ST_...`) | `ST_1234567890` |
| `LIVEKIT_SIP_CALLER_NUMBER` | Caller ID number in E.164 format | `+19897474190` |
| `SMTP_HOST` | Transactional email SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `465` (SSL) or `587` (TLS) |
| `SMTP_USER` | SMTP username / email address | `recovraai@gmail.com` |
| `SMTP_PASS` | SMTP application password | `xxxx xxxx xxxx xxxx` |
| `SMTP_FROM` | Sender address | `"Recovra" <recovraai@gmail.com>` |

---

## Voice Agent & Telephony

### Outbound PSTN Dialing (Twilio Elastic SIP Trunk)

The voice agent is capable of initiating real outbound phone calls directly to borrowers' mobile devices:

1. **Twilio Trunk**:
   - Create an **Elastic SIP Trunk** in the Twilio Console.
   - Attach your voice-enabled phone number.
   - Configure the Termination SIP URI and attach a Credential List (username/password).
   - Enable destination country dialing permissions.
2. **LiveKit SIP Trunk**:
   - In [LiveKit Cloud](https://cloud.livekit.io), create an **Outbound SIP Trunk** pointing to your Twilio termination URI.
   - Use the Twilio number as the caller number and supply the Credential List credentials.
   - Copy the generated trunk ID (`ST_...`) into `LIVEKIT_SIP_OUTBOUND_TRUNK_ID` in `.env`.
3. **Dispatch a Test Outbound Call**:
   Authenticate the LiveKit CLI (`lk`) and dispatch a room with account metadata:

   ```bash
   lk dispatch create \
     --new-room \
     --agent-name recovra-collection-agent \
     --metadata '{"phone_number":"+12025550123","accountId":"test-account","debtorName":"John Doe","originalCreditor":"First National Bank","currentBalance":1250.00,"daysPastDue":45,"maxDiscountPercent":20}'
   ```

> [!IMPORTANT]
> Executing the dispatch command places an actual, billable phone call. Ensure you have consent and comply with FDCPA, TCPA, and regional debt collection calling laws before placing calls.

### Browser Audio Simulation

To test the voice agent in your browser without dialing a phone number:
1. Open the CRM at [http://localhost:3000](http://localhost:3000).
2. Navigate to **Agent Sandbox** (`/agent`) or click **Simulate Call** on any customer page.
3. Grant microphone permissions to converse with the agent in real time.

---

## Model Context Protocol (MCP) Server

Recovra includes a native MCP server in `crm/mcp_server/server.js`, enabling LLMs and AI coding assistants to interact with live CRM records.

### Connecting to Antigravity IDE
Add the following entry to `~/.gemini/config/mcp_config.json`:

```json
{
  "mcpServers": {
    "recovra-crm": {
      "command": "node",
      "args": [
        "/absolute/path/to/rec-crm/crm/mcp_server/server.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Available Tools

| Tool Name | Description | Parameters |
| :--- | :--- | :--- |
| `get_dashboard_summary` | Fetches overall portfolio metrics, total balance, overdue/pre-due breakdown, PTP totals, and 30-day interaction trends. | `days` *(optional, default: 30)* |
| `get_customers` | Search debtor accounts with filters for status, aging buckets, or minimum days past due. | `query`, `status`, `bucket`, `minDaysPastDue`, `limit` |
| `get_customer_detail` | Detailed record for a debtor by account ID, name, or phone, including notes and verbatim call transcripts. | `identifier` *(required)* |
| `get_delinquency_and_aging` | Breakdown of overdue vs. pre-due balances across all delinquency aging buckets (Current, 30 DPD, 60 DPD, 90 DPD, 120+ DPD). | *None* |
| `get_calls_and_telemetry` | Query call records, durations, dispositions (`PROMISE_TO_PAY`, `CALL_BACK`, etc.), compliance scores, and speech transcripts. | `accountId`, `disposition`, `status`, `limit`, `includeTranscripts` |
| `get_recovery_queue` | Inspect the automated retry queue for calls that went to voicemail, were unanswered, or requested callbacks. | `status` |

---

## Scripts & Operations

The project provides top-level convenience scripts for managing the system lifecycle:

```bash
# Start the full containerized stack (CRM + Voice Agent)
./start.sh

# Check container health and service statuses
./status.sh

# Follow live container output
./logs.sh

# Stop and remove all running containers
./stop.sh

# Rebuild containers after code modifications and restart cleanly
./redeploy.sh

# Run Next.js CRM locally in development mode
./start.sh dev

# Run LiveKit Python Voice Agent worker locally in development mode
./start.sh agent

# Validate Next.js production build
./start.sh build
```

---

## Inbound Webhook Integration

External billing systems, core banking platforms, and loan servicing software can push delinquent accounts or balance updates to Recovra via the HTTP webhook endpoint:

- **Endpoint**: `POST /api/webhooks`
- **Headers**:
  - `Content-Type: application/json`
  - `x-webhook-key: <YOUR_WEBHOOK_KEY>` *(configured in Settings)*

### Sample Inbound Payload

```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "phoneNumber": "+15551234567",
  "country": "US",
  "overdueAmount": 850.50,
  "predueAmount": 150.00,
  "accountNumber": "ACC-98231",
  "originalCreditor": "Apex Lending Corp",
  "metadata": {
    "loanType": "Personal",
    "originationDate": "2025-01-15"
  },
  "notes": "Borrower missed second installment after address change."
}
```

---

## Testing & Quality Assurance

### Voice Agent Unit Tests
The voice agent includes unit tests mocking external speech providers and CRM endpoints:

```bash
# Run unit tests
PYTHON_DOTENV_DISABLED=1 python3 -m unittest discover -s voice_agent -p 'test_*.py'
```

### CRM TypeScript & Lint Verification
```bash
# Run type check and lint
npm --prefix crm run lint
```

---

## Compliance & Security Notice

- **Mini-Miranda & Disclosure**: Recovra includes automated prompts for statutory collection disclosures. Ensure disclosure scripts conform to your local legal requirements.
- **Calling Window Restrictions**: Telephony dispatches must honor consumer calling hour limits (typically 8:00 AM – 9:00 PM local time).
- **Tenant Isolation**: When hosting multi-tenant accounts, verify that queries and API keys are isolated according to organizational policy.
- **Recording & Consent**: Ensure two-party or one-party consent regulations are satisfied if enabling persistent audio recording.

---

## License

Private and proprietary. All rights reserved. Built for autonomous recovery workflows.
