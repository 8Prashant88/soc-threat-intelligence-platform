/**
 * SecureLogTI - API Endpoint Dialog
 * Documents the live log-ingestion endpoint used by device agents and scripts.
 */

"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy, Check, Terminal, Key } from "lucide-react"
import Link from "next/link"

interface ApiEndpointDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApiEndpointDialog({ open, onOpenChange }: ApiEndpointDialogProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

  const apiEndpoint = `${origin || ""}/api/ingest`

  const examplePayload = JSON.stringify(
    {
      logs: [
        {
          timestamp: new Date().toISOString(),
          source_ip: "192.168.1.100",
          type: "auth",
          message: "Failed password for admin from 192.168.1.100 port 22 ssh2",
          severity: "warning",
        },
      ],
    },
    null,
    2,
  )

  const curlExample = `curl -X POST "${apiEndpoint}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <your-api-key>" \\
  -d '${JSON.stringify({ logs: ["Failed password for admin from 192.168.1.100 port 22 ssh2"] })}'`

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
            Log Ingestion API
          </DialogTitle>
          <DialogDescription>
            Programmatically stream logs from any device. For automatic, real-time macOS collection, use the agent in{" "}
            <span className="text-primary">Settings → Devices &amp; API Keys</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Endpoint URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">Endpoint URL</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-secondary rounded-md px-3 py-2 text-sm font-mono text-primary">
                POST {apiEndpoint}
              </code>
              <Button variant="outline" size="icon" onClick={() => handleCopy(apiEndpoint, "endpoint")}>
                {copied === "endpoint" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Key
            </label>
            <div className="rounded-md bg-secondary px-3 py-2 text-sm text-card-foreground">
              Create a device key in{" "}
              <Link href="/settings" className="text-primary underline underline-offset-2">
                Settings → Devices &amp; API Keys
              </Link>
              , then send it as <code className="text-primary">Authorization: Bearer &lt;key&gt;</code>.
            </div>
          </div>

          {/* Request Headers */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">Required Headers</label>
            <div className="bg-secondary rounded-md p-3 font-mono text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Content-Type:</span>{" "}
                <span className="text-card-foreground">application/json (or text/plain)</span>
              </p>
              <p>
                <span className="text-muted-foreground">Authorization:</span>{" "}
                <span className="text-card-foreground">Bearer {"<your-api-key>"}</span>
              </p>
            </div>
          </div>

          {/* Example Payload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-card-foreground">Example Payload</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(examplePayload, "payload")}
                className="h-7 text-xs"
              >
                {copied === "payload" ? (
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
            <pre className="bg-secondary rounded-md p-3 text-xs font-mono text-card-foreground overflow-x-auto">
              {examplePayload}
            </pre>
            <p className="text-xs text-muted-foreground">
              You can also POST raw log lines: <code>{`{ "logs": ["raw line 1", "raw line 2"] }`}</code> — the server
              auto-detects the format.
            </p>
          </div>

          {/* cURL Example */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-card-foreground">cURL Example</label>
              <Button variant="ghost" size="sm" onClick={() => handleCopy(curlExample, "curl")} className="h-7 text-xs">
                {copied === "curl" ? (
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
              {curlExample}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
