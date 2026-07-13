# soc-threat-intelligence-platform
Enterprise-grade rule-based SOC threat detection &amp; IP reputation enrichment platform supporting 7+ log formats.

## 📌 Current Status

✔ Stable log ingestion via paste & file upload  
✔ **Automatic real-time log collection from devices (API keys + macOS agent)**  
✔ **Live auto-refreshing dashboard, logs, and alerts**  
✔ Multi-format parsing (7+ formats)  
✔ 5-factor explainable threat detection  
✔ IP reputation enrichment (AbuseIPDB integration)  
✔ Dashboard visualization  

## 🔌 Real-Time Device Log Collection

Devices stream their logs to the platform continuously; each batch is parsed,
analyzed, scored, and turned into alerts on arrival. The dashboard, logs, and
alerts pages auto-refresh (every 5s) so new activity appears without a manual
reload.

### 1. Create a device API key

Go to **Settings → Devices & API Keys**, create a key, and copy it (shown once).

### 2. Run the macOS agent

The agent streams this Mac's unified log and ships security-relevant events:

```bash
export SECURELOG_ENDPOINT="http://localhost:3000/api/ingest"
export SECURELOG_API_KEY="slt_xxxxxxxx..."
./scripts/securelog-agent.sh
```

Tunables (env vars): `SECURELOG_PREDICATE`, `SECURELOG_BATCH_SIZE`,
`SECURELOG_FLUSH_SECS`, `SECURELOG_LEVEL`. Note: macOS may mask source IPs as
`<private>` in the unified log unless a logging profile enabling private data is
installed.

### 3. Or POST directly from any device

`POST /api/ingest` with `Authorization: Bearer <key>`:

```bash
curl -X POST "http://localhost:3000/api/ingest" \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: text/plain" \
  --data-binary "Jan 16 10:30:00 server sshd[1234]: Failed password for admin from 192.168.1.100 port 22 ssh2"
```

JSON is also accepted: `{ "logs": ["raw line", ...] }` or `{ "content": "..." }`.


## 🛡️ SOC Analyst Perspective

This platform simulates how a Tier 1 SOC analyst:

- Parses raw logs
- Identifies suspicious patterns
- Enriches alerts with threat intelligence
- Prioritizes based on risk score
- Generates investigation-ready summaries
