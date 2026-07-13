/**
 * SecureLogTI - Devices & API Keys
 * Create per-device API keys and copy the one-line command that starts the
 * macOS log-shipping agent for real-time, automatic log collection.
 */

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Copy, Check, Key, Plus, Trash2, Laptop, AlertTriangle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  getApiKeys,
  createApiKey as apiCreateKey,
  revokeApiKey as apiRevokeKey,
  type ApiKeySummary,
} from "@/lib/data-store"

export function ApiKeysCard() {
  const { user } = useAuth()
  const [keys, setKeys] = useState<ApiKeySummary[]>([])
  const [newKeyName, setNewKeyName] = useState("")
  const [creating, setCreating] = useState(false)
  const [freshKey, setFreshKey] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

  useEffect(() => {
    if (!user?.id) return
    let mounted = true
    getApiKeys(user.id)
      .then((k) => mounted && setKeys(k))
      .catch(() => mounted && setKeys([]))
    return () => {
      mounted = false
    }
  }, [user?.id])

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleCreate = async () => {
    if (!user?.id || creating) return
    setCreating(true)
    try {
      const created = await apiCreateKey(user.id, newKeyName || "My Mac")
      setFreshKey(created.plaintext)
      setNewKeyName("")
      const refreshed = await getApiKeys(user.id)
      setKeys(refreshed)
    } catch {
      // ignore
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (keyId: string) => {
    if (!user?.id) return
    try {
      await apiRevokeKey(user.id, keyId)
      setKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, revoked: true } : k)))
    } catch {
      // ignore
    }
  }

  const endpoint = origin ? `${origin}/api/ingest` : "/api/ingest"
  const setupCommand = `export SECURELOG_ENDPOINT="${endpoint}"
export SECURELOG_API_KEY="${freshKey ?? "<your-api-key>"}"
./scripts/securelog-agent.sh`

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground flex items-center gap-2">
          <Laptop className="h-5 w-5 text-primary" />
          Devices & API Keys
        </CardTitle>
        <CardDescription>
          Create a key for each device, then run the agent to automatically stream its logs here for real-time analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create a key */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-card-foreground">New device name</label>
            <Input
              placeholder="e.g. MacBook Pro"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <Button onClick={handleCreate} disabled={creating} className="bg-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" />
            {creating ? "Creating..." : "Create Key"}
          </Button>
        </div>

        {/* One-time fresh key display */}
        {freshKey && (
          <div className="rounded-lg border border-success/40 bg-success/10 p-4 space-y-3">
            <div className="flex items-center gap-2 text-success">
              <Key className="h-4 w-4" />
              <span className="text-sm font-medium">New key created — copy it now, it won&apos;t be shown again.</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-md bg-secondary px-3 py-2 font-mono text-sm text-card-foreground">
                {freshKey}
              </code>
              <Button variant="outline" size="icon" onClick={() => handleCopy(freshKey, "fresh")}>
                {copied === "fresh" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Setup command */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-card-foreground">Start the macOS agent</label>
            <Button variant="ghost" size="sm" onClick={() => handleCopy(setupCommand, "cmd")} className="h-7 text-xs">
              {copied === "cmd" ? (
                <>
                  <Check className="mr-1 h-3 w-3 text-success" /> Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-3 w-3" /> Copy
                </>
              )}
            </Button>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-secondary p-3 font-mono text-xs text-card-foreground">
            {setupCommand}
          </pre>
          <p className="text-xs text-muted-foreground">
            Run from the project root. The agent streams security events from this Mac&apos;s unified log and ships them to{" "}
            <code className="text-primary">{endpoint}</code> in real time.
          </p>
        </div>

        {/* Existing keys */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-card-foreground">Your keys</label>
          {keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No keys yet. Create one above to connect a device.</p>
          ) : (
            <div className="divide-y divide-border rounded-md border border-border">
              {keys.map((key) => (
                <div key={key.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-card-foreground truncate">{key.name}</span>
                      {key.revoked && (
                        <Badge variant="outline" className="text-danger border-danger/50 text-xs">
                          Revoked
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{key.prefix}…</p>
                    <p className="text-xs text-muted-foreground">
                      {key.lastUsedAt
                        ? `Last used ${new Date(key.lastUsedAt).toLocaleString()}`
                        : "Never used"}
                    </p>
                  </div>
                  {!key.revoked && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-danger border-danger/50 hover:bg-danger/10 bg-transparent shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke this key?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Any device using &quot;{key.name}&quot; will immediately stop being able to send logs. This cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRevoke(key.id)}
                            className="bg-danger text-danger-foreground hover:bg-danger/90"
                          >
                            Revoke
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Private-data caveat */}
        <div className="flex gap-2 rounded-lg bg-warning/10 border border-warning/30 p-3">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-card-foreground">
            macOS may mask some fields (including source IPs) as <code>&lt;private&gt;</code> in the unified log. Threat
            detection works for every event whose IP is visible; to capture private data, install a logging
            configuration profile that enables it.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
