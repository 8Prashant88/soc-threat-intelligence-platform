/**
 * SecureLogTI - Log Ingestion Dialog
 * Beginner-friendly, cross-platform guide for streaming device logs into the
 * platform (macOS / Linux / Windows agents) plus a raw API reference.
 */

"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Copy, Check, Terminal, Key, FileText } from "lucide-react"
import Link from "next/link"

interface ApiEndpointDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function CodeBlock({
  code,
  id,
  copied,
  onCopy,
}: {
  code: string
  id: string
  copied: string | null
  onCopy: (text: string, id: string) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end">
        <Button variant="ghost" size="sm" onClick={() => onCopy(code, id)} className="h-7 text-xs">
          {copied === id ? (
            <>
              <Check className="mr-1 h-3 w-3 text-success" />
              Copied
            </>
          ) : (
            <>
              <Copy className="mr-1 h-3 w-3" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="bg-secondary rounded-md p-3 text-xs font-mono text-card-foreground overflow-x-auto whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  )
}

export function ApiEndpointDialog({ open, onOpenChange }: ApiEndpointDialogProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

  const apiEndpoint = `${origin || "http://localhost:3000"}/api/ingest`

  // Per-OS one-time setup: create a key, then run the matching agent.
  const macOsCmd = `export SECURELOG_ENDPOINT="${apiEndpoint}"
export SECURELOG_API_KEY="<paste-your-key>"
./scripts/securelog-agent.sh`

  const linuxCmd = `export SECURELOG_ENDPOINT="${apiEndpoint}"
export SECURELOG_API_KEY="<paste-your-key>"
./scripts/securelog-agent-linux.sh`

  const windowsCmd = `$env:SECURELOG_ENDPOINT="${apiEndpoint}"
$env:SECURELOG_API_KEY="<paste-your-key>"
.\\scripts\\securelog-agent.ps1`

  const curlExample = `curl -X POST "${apiEndpoint}" \\
  -H "Authorization: Bearer <paste-your-key>" \\
  -H "Content-Type: text/plain" \\
  --data-binary "Failed password for admin from 192.168.1.100 port 22 ssh2"`

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-card-foreground flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            Send logs from your device
          </DialogTitle>
          <DialogDescription>
            Stream this computer&apos;s security logs in real time. New events show up on this page automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* No-terminal option, friendliest path */}
          <div className="rounded-lg border border-border bg-secondary/50 p-3 text-sm text-muted-foreground flex items-start gap-2">
            <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>
              <span className="font-medium text-card-foreground">No terminal needed?</span> Close this and use{" "}
              <span className="text-primary">Paste Logs</span> or <span className="text-primary">Upload File</span> —
              works on any device: just copy your log text or drop in a <code>.log</code>/<code>.txt</code> file.
            </span>
          </div>

          {/* Step 1: key */}
          <div className="space-y-1">
            <p className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              Step 1 — Create a device key
            </p>
            <p className="text-sm text-muted-foreground">
              Go to{" "}
              <Link href="/settings" className="text-primary underline underline-offset-2">
                Settings → Devices &amp; API Keys
              </Link>
              , create a key, and copy it (shown once). Paste it into the command below in place of{" "}
              <code>&lt;paste-your-key&gt;</code>.
            </p>
          </div>

          {/* Step 2: pick your OS */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" />
              Step 2 — Run the agent for your system
            </p>
            <Tabs defaultValue="macos">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="macos">macOS</TabsTrigger>
                <TabsTrigger value="linux">Linux</TabsTrigger>
                <TabsTrigger value="windows">Windows</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger>
              </TabsList>

              <TabsContent value="macos" className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">
                  Run from the project folder in Terminal. Ships your Mac&apos;s unified security log.
                </p>
                <CodeBlock code={macOsCmd} id="macos" copied={copied} onCopy={handleCopy} />
              </TabsContent>

              <TabsContent value="linux" className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">
                  Run from the project folder. Auto-detects systemd journal or <code>/var/log/auth.log</code> /{" "}
                  <code>secure</code> (use <code>sudo</code> if needed).
                </p>
                <CodeBlock code={linuxCmd} id="linux" copied={copied} onCopy={handleCopy} />
              </TabsContent>

              <TabsContent value="windows" className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">
                  Run in PowerShell (as Administrator to read the Security log). Ships Windows event logs.
                </p>
                <CodeBlock code={windowsCmd} id="windows" copied={copied} onCopy={handleCopy} />
              </TabsContent>

              <TabsContent value="other" className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">
                  Any device or language can POST logs to the endpoint below. Send raw log lines as text:
                </p>
                <CodeBlock code={curlExample} id="curl" copied={copied} onCopy={handleCopy} />
                <p className="text-xs text-muted-foreground mt-2">
                  JSON also works: <code>{`{ "logs": ["raw line 1", "raw line 2"] }`}</code> — the server
                  auto-detects the format.
                </p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Endpoint reference */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Your ingestion endpoint</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-secondary rounded-md px-3 py-2 text-sm font-mono text-primary overflow-x-auto">
                POST {apiEndpoint}
              </code>
              <Button variant="outline" size="icon" onClick={() => handleCopy(apiEndpoint, "endpoint")}>
                {copied === "endpoint" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Streaming from a <span className="text-card-foreground">different</span> machine? Replace{" "}
              <code>localhost</code> with this server&apos;s IP address (e.g. <code>http://192.168.1.50:3000</code>).
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
