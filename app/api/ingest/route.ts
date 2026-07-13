import { NextResponse } from "next/server"
import { parseLogs } from "@/lib/log-parser"
import { addUserLogs, resolveApiKey } from "@/lib/db"
import { extractApiKey } from "@/lib/api-keys"
import type { ParsedLogResult } from "@/lib/types"

// Device log shippers hold long-lived connections / frequent posts — run on
// the Node.js runtime (Prisma + crypto are not available on the edge runtime).
export const runtime = "nodejs"

/**
 * API: POST /api/ingest
 * Continuous device log ingestion endpoint.
 *
 * Authentication (required): a device API key, supplied as either
 *   Authorization: Bearer <key>
 *   x-api-key: <key>
 * Keys are created per-device in Settings → Devices & API Keys.
 *
 * Body — any of:
 *   application/json  { "logs": ["raw line", ...] }
 *   application/json  { "content": "raw\nlog\ntext" }
 *   text/plain        raw log text (one or more lines)
 *
 * On success the logs are parsed, stored, and the threat algorithm runs
 * immediately, so detections/alerts are available to the live dashboard.
 */
export async function POST(req: Request) {
  try {
    const apiKey = extractApiKey(req.headers)
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "Missing API key (Authorization: Bearer <key> or x-api-key header)" },
        { status: 401 },
      )
    }

    const userId = await resolveApiKey(apiKey)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Invalid or revoked API key" }, { status: 401 })
    }

    const contentType = req.headers.get("content-type") || ""
    let rawText: string | undefined

    if (contentType.includes("application/json")) {
      const body = await req.json()
      if (Array.isArray(body.logs)) {
        rawText = body.logs.join("\n")
      } else if (typeof body.content === "string") {
        rawText = body.content
      }
    } else if (contentType.includes("text/plain")) {
      rawText = await req.text()
    } else {
      return NextResponse.json({ success: false, message: "Unsupported content type" }, { status: 415 })
    }

    if (!rawText || !rawText.trim()) {
      return NextResponse.json({ success: false, message: "No log content provided" }, { status: 400 })
    }

    const parseResult: ParsedLogResult = parseLogs(rawText)
    if (!parseResult || !parseResult.success) {
      return NextResponse.json({ success: false, message: "Failed to parse logs", parseResult }, { status: 400 })
    }

    const added = await addUserLogs(userId, parseResult.entries)

    return NextResponse.json({
      success: true,
      addedCount: added.length,
      parsedLines: parseResult.parsedLines,
      totalLines: parseResult.totalLines,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Internal error" }, { status: 500 })
  }
}
