# Recovra CRM MCP Server

Model Context Protocol (MCP) server providing AI agents with real-time access to the Recovra Debt Collection CRM ledger, customer accounts, aging balances, and voice call telemetry.

---

## Registered MCP Tools

| Tool Name | Purpose | Parameters |
| :--- | :--- | :--- |
| `get_dashboard_summary` | Fetch overall portfolio health, total accounts, total balance, total overdue (&ge;30 DPD), total pre-due (<30 DPD), promises-to-pay (PTP), total calls made, recovery rate, compliance score, and 30-day interaction trends. | `days` (optional, default 30) |
| `get_customers` | Search and query customer/client accounts with filters for status, aging buckets, or minimum days past due. | `query`, `status`, `bucket`, `minDaysPastDue`, `limit` |
| `get_customer_detail` | Deep-dive lookup for a specific debtor by account ID, name, or phone. Returns profile, notes, promise-to-pay status, and full voice call logs with verbatim transcripts. | `identifier` (required) |
| `get_delinquency_and_aging` | Comprehensive breakdown of overdue balances vs pre-due balances across all delinquency aging buckets (Current, 30 DPD, 60 DPD, 90 DPD, 120+ DPD). | None |
| `get_calls_and_telemetry` | Query voice call records, total calls made, call durations, dispositions (e.g. `CALL_BACK`, `PROMISE_TO_PAY`), compliance scores, and speech transcripts. | `accountId`, `disposition`, `status`, `limit`, `includeTranscripts` |
| `get_recovery_queue` | Inspect the automated retry queue for calls that went to voicemail, were unanswered, or requested callbacks. Shows retry attempt counts and intervals. | `status` |

---

## Configuration

### Antigravity IDE Configuration
Registered in `~/.gemini/config/mcp_config.json`:

```json
{
  "mcpServers": {
    "recovra-crm": {
      "command": "node",
      "args": [
        "/home/mohit/code/collection_crm/crm/mcp_server/server.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Manual CLI Execution / Testing
```bash
cd /home/mohit/code/collection_crm/crm/mcp_server
node server.js
```
