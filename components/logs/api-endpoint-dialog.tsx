/**
 * SecureLogTI - API Endpoint Dialog
 * Shows the mock API endpoint for programmatic log submission
 */

"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, Terminal, Key } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface ApiEndpointDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApiEndpointDialog({ open, onOpenChange }: ApiEndpointDialogProps) {
  const { user } = useAuth()
  const [copied, setCopied] = useState<string | null>(null)

  // Mock API endpoint info
  const apiEndpoint = "https://api.securelogti.com/v1/logs"
  const mockApiKey = `slt_${user?.id?.slice(0, 8) || "demo"}_${Date.now().toString(36)}`

  const examplePayload = JSON.stringify(
    {
      logs: [
        {
          timestamp: new Date().toISOString(),
          source_ip: "192.168.1.100",
          log_type: "auth",
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
  -H "Authorization: Bearer ${mockApiKey}" \\
  -d '${JSON.stringify({ logs: [{ timestamp: new Date().toISOString(), source_ip: "192.168.1.100", log_type: "auth", message: "Example log message", severity: "info" }] })}'`

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
            API Endpoint
            <Badge variant="outline" className="ml-2 text-xs">
              Mock / Academic
            </Badge>
          </DialogTitle>
          <DialogDescription>Use this endpoint to programmatically submit logs to your account.</DialogDescription>
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
              Your API Key
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-secondary rounded-md px-3 py-2 text-sm font-mono text-muted-foreground">
                {mockApiKey}
              </code>
              <Button variant="outline" size="icon" onClick={() => handleCopy(mockApiKey, "apikey")}>
                {copied === "apikey" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Note: This is a mock API key for demonstration purposes.</p>
          </div>

          {/* Request Headers */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">Required Headers</label>
            <div className="bg-secondary rounded-md p-3 font-mono text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Content-Type:</span>{" "}
                <span className="text-card-foreground">application/json</span>
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

          {/* Note */}
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
            <p className="text-sm text-card-foreground">
              <strong>Note:</strong> This API endpoint is mocked for academic demonstration purposes. In a production
              environment, this would connect to a real backend service that processes and stores your log data
              securely.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
