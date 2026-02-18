import { NextResponse } from "next/server"
import { parseLogs } from "@/lib/log-parser"
import { addUserLogs, findUserById } from "@/lib/data-store"
import type { ParsedLogResult } from "@/lib/types"

/**
 * API: /api/ingest
 * Accepts device log submissions and stores them for a user.
 *
 * POST body (JSON) options:
 * - { userId: string, logs: string[] }  -> array of raw log lines
 * - { userId: string, content: string } -> raw text with one or more lines
 *
 * Also supports `text/plain` POST with raw log text. For this demo server we
 * accept `userId` in a JSON body or `x-user-id` header. In production replace
 * this with proper authentication (API keys / tokens) and rate-limiting.
 */

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || ""

    // Determine userId
    let userId: string | undefined = req.headers.get("x-user-id") || undefined

    let rawText: string | undefined
    if (contentType.includes("application/json")) {
      const body = await req.json()
      userId = userId || body.userId
      if (Array.isArray(body.logs)) {
        rawText = body.logs.join("\n")
      } else if (typeof body.content === "string") {
        rawText = body.content
      }
    } else if (contentType.includes("text/plain")) {
      rawText = await req.text()
      // userId may be passed as header
    } else {
      return NextResponse.json({ success: false, message: "Unsupported content type" }, { status: 415 })
    }

    if (!userId) {
      return NextResponse.json({ success: false, message: "Missing userId (provide x-user-id header or JSON userId)" }, { status: 400 })
    }

    const user = findUserById(userId)
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    if (!rawText || !rawText.trim()) {
      return NextResponse.json({ success: false, message: "No log content provided" }, { status: 400 })
    }

    const parseResult: ParsedLogResult = parseLogs(rawText)

    if (!parseResult || !parseResult.success) {
      return NextResponse.json({ success: false, message: "Failed to parse logs", parseResult }, { status: 400 })
    }

    const added = addUserLogs(userId, parseResult.entries)

    return NextResponse.json({ success: true, addedCount: added.length, added })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Internal error" }, { status: 500 })
  }
}
