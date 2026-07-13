# SecureLogTI - Windows Log Shipper Agent
# ----------------------------------------
# Streams this Windows machine's Security / System event logs and forwards them
# to your SecureLogTI instance in real time, where they are parsed, analyzed,
# and turned into threat intelligence and alerts.
#
# Usage (PowerShell):
#   $env:SECURELOG_ENDPOINT = "http://localhost:3000/api/ingest"
#   $env:SECURELOG_API_KEY  = "slt_xxxxxxxx..."   # create one in Settings -> Devices & API Keys
#   .\securelog-agent.ps1
#
# Optional environment variables:
#   SECURELOG_POLL_SECS   Seconds between polls for new events (default: 5)
#   SECURELOG_LOGS        Comma-separated event logs to watch (default: "Security,System")
#
# Notes:
#  * Reading the Security log usually requires an elevated (Administrator) shell.
#  * Run from the project folder or anywhere; only the two env vars are required.

$ErrorActionPreference = "Stop"

$Endpoint = $env:SECURELOG_ENDPOINT
$ApiKey   = $env:SECURELOG_API_KEY
if (-not $Endpoint) { throw "Set SECURELOG_ENDPOINT, e.g. http://localhost:3000/api/ingest" }
if (-not $ApiKey)   { throw "Set SECURELOG_API_KEY to your device key (Settings -> Devices & API Keys)" }

$PollSecs = if ($env:SECURELOG_POLL_SECS) { [int]$env:SECURELOG_POLL_SECS } else { 5 }
$Logs     = if ($env:SECURELOG_LOGS) { $env:SECURELOG_LOGS -split "," } else { @("Security", "System") }

Write-Host "[securelog-agent] streaming Windows event logs -> $Endpoint"
Write-Host "[securelog-agent] logs: $($Logs -join ', ')  (poll every ${PollSecs}s)"

# Start from now so we only ship new events.
$lastCheck = Get-Date

while ($true) {
    Start-Sleep -Seconds $PollSecs
    $now = Get-Date
    $lines = New-Object System.Collections.Generic.List[string]

    foreach ($logName in $Logs) {
        try {
            $events = Get-WinEvent -FilterHashtable @{ LogName = $logName.Trim(); StartTime = $lastCheck } -ErrorAction SilentlyContinue
            foreach ($e in $events) {
                $msg = ($e.Message -replace "\r?\n", " ").Trim()
                $ts  = $e.TimeCreated.ToString("yyyy-MM-ddTHH:mm:ss")
                # A syslog-like line the server parser understands.
                $lines.Add("$ts $env:COMPUTERNAME $($e.ProviderName)[$($e.Id)]: $msg")
            }
        } catch {
            Write-Warning "[securelog-agent] could not read '$logName': $($_.Exception.Message)"
        }
    }

    $lastCheck = $now
    if ($lines.Count -eq 0) { continue }

    $payload = ($lines -join "`n")
    try {
        Invoke-RestMethod -Method Post -Uri $Endpoint `
            -Headers @{ Authorization = "Bearer $ApiKey" } `
            -ContentType "text/plain" -Body $payload | Out-Null
        Write-Host "[securelog-agent] shipped $($lines.Count) events"
    } catch {
        Write-Warning "[securelog-agent] failed to deliver batch, will retry: $($_.Exception.Message)"
    }
}
