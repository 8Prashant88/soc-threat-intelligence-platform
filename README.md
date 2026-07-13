# SecureLogTI — SOC Threat Intelligence Platform

A lightweight, self-hosted **SOC-style platform for your personal devices**.
Point your Mac (or any device) at it with an API key and it captures the logs in
**real time**, parses 7+ formats, scores threats with an explainable rule engine,
enriches IPs with reputation data, and raises alerts on a live dashboard.

Each account is isolated: a device's API key maps to one user, so **your devices'
logs only ever appear in your account.** Multiple people can each run their own
instance, or share one instance and each sign up for their own account.

## ✨ Features

- 🔌 **Real-time device log collection** — API keys + a macOS streaming agent
- 📥 Manual ingestion too — paste or upload log files
- 🧩 Multi-format parsing (syslog, auth, firewall, Apache/Nginx, macOS unified &
  system logs, Docker/K8s, Windows Event Log, JSON, DB audit)
- 🧠 5-factor explainable threat detection (brute force, SQLi, malware, DDoS, …)
- 🌐 IP reputation enrichment (offline heuristics; optional AbuseIPDB key)
- 📊 Live auto-refreshing dashboard, logs, threats, and alerts (every 5s)
- 👥 Per-account isolation via signup + device API keys

---

## 🚀 Quick Start (fresh clone)

**Prerequisites:** Node.js 18+ and npm.

```bash
# 1. Clone
git clone https://github.com/8Prashant88/soc-threat-intelligence-platform.git
cd soc-threat-intelligence-platform

# 2. Install dependencies (auto-generates the Prisma client via postinstall)
npm install

# 3. Create the local database (applies migrations → prisma/dev.db)
npm run setup

# 4. (Optional) configure environment
cp .env.example .env.local     # add an AbuseIPDB key if you have one

# 5. Run
npm run dev
```

Open **http://localhost:3000** and either:

- **Sign up** to create your own account (starts empty; fills up as your devices
  stream logs in), or
- Log in to the **demo account** to explore a pre-populated dashboard:
  `demo@securelogti.com` / `demo123` (created by `npm run setup`).

> The SQLite database (`prisma/dev.db`) is **not** committed — it's created
> locally by `npm run setup`, so no one else's real data ships with the repo.
> The only seeded data is the harmless demo account above (synthetic sample logs).

---

## 🔌 Stream a device's logs in real time

### 1. Create a device API key
In the app: **Settings → Devices & API Keys → New key**. Copy it — it's shown once.

### 2. Run the agent for your OS
Set two environment variables (your endpoint + key), then run the agent for
your platform. New events appear on the dashboard within seconds. In the app,
the **Logs → Add Logs → Stream from Device** dialog shows these commands
pre-filled for you.

**macOS** (streams the unified security log):
```bash
export SECURELOG_ENDPOINT="http://localhost:3000/api/ingest"
export SECURELOG_API_KEY="slt_xxxxxxxx..."   # the key you just created
npm run agent            # or: ./scripts/securelog-agent.sh
```

**Linux** (systemd journal, or `/var/log/auth.log` / `secure`):
```bash
export SECURELOG_ENDPOINT="http://localhost:3000/api/ingest"
export SECURELOG_API_KEY="slt_xxxxxxxx..."
./scripts/securelog-agent-linux.sh      # run with sudo if you can't read the auth logs
```

**Windows** (Security / System event logs — run PowerShell as Administrator):
```powershell
$env:SECURELOG_ENDPOINT="http://localhost:3000/api/ingest"
$env:SECURELOG_API_KEY="slt_xxxxxxxx..."
.\scripts\securelog-agent.ps1
```

> **macOS note:** macOS masks remote IPs as `<private>` in the unified log
> unless a logging configuration profile enabling private data is installed.
> Detection still works for any event whose IP is visible (e.g. `sshd` failures
> with Remote Login enabled + a private-data profile).

### 3. Collecting from *other* machines
Run the instance on one machine and set `SECURELOG_ENDPOINT` on each device to
that machine's address, e.g. `http://192.168.1.50:3000/api/ingest`. Give each
device its own API key so you can revoke them individually.

### 4. No terminal? Upload or paste
For a one-off or a non-technical user, the **Logs** page also accepts a pasted
log snippet or an uploaded `.log`/`.txt` file — no agent or command line needed.

### 5. Or POST directly from any device / OS
```bash
curl -X POST "http://localhost:3000/api/ingest" \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: text/plain" \
  --data-binary "Jan 16 10:30:00 host sshd[1234]: Failed password for admin from 192.168.1.100 port 22 ssh2"
```
JSON is also accepted: `{ "logs": ["raw line", ...] }` or `{ "content": "..." }`.

Linux example (tail auth log):
```bash
tail -n0 -F /var/log/auth.log | while read -r line; do
  curl -s -X POST "http://<host>:3000/api/ingest" \
    -H "Authorization: Bearer <your-api-key>" \
    -H "Content-Type: text/plain" --data-binary "$line" >/dev/null
done
```

---

## 🧰 Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the app (http://localhost:3000) |
| `npm run setup` | Generate Prisma client + create/upgrade the database |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:reset` | ⚠️ Drop and recreate the database (wipes all data) |
| `npm run db:studio` | Browse the database in Prisma Studio |
| `npm run agent` | Run the macOS log-shipping agent |
| `npm run build` / `npm start` | Production build & serve |

---

## 🛡️ SOC Analyst Perspective

The platform mirrors how a Tier 1 SOC analyst works: parse raw logs, identify
suspicious patterns, enrich with threat intelligence, prioritise by risk score,
and produce investigation-ready summaries — automatically, in real time.

## ⚠️ Notes

- Authentication is a **simplified, localStorage-based demo** intended for
  personal/local use, not hardening for the public internet. If you expose the
  instance beyond localhost, put it behind a trusted network or reverse proxy
  with real auth.
- Data is stored in a local **SQLite** database (`prisma/dev.db`).

## 📄 License

Released under the [MIT License](LICENSE).
