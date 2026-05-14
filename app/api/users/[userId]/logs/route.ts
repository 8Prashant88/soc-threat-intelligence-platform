import { NextResponse } from "next/server"
import { addUserLogs, findUserById, getUserLogs, clearUserLogs } from "@/lib/db"
import type { ParsedLogResult } from "@/lib/types"

export async function GET(_: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const user = await findUserById(userId)
  if (!user) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
  }

  const logs = await getUserLogs(userId)
  return NextResponse.json({ success: true, logs })
}

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const user = await findUserById(userId)
  if (!user) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
  }

  const body = await req.json()
  const entries = body?.entries as ParsedLogResult["entries"]
  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ success: false, message: "No log entries provided" }, { status: 400 })
  }

  const parsedEntries = entries.map((entry) => ({
    ...entry,
    timestamp: new Date(entry.timestamp),
  }))

  const addedLogs = await addUserLogs(userId, parsedEntries)
  return NextResponse.json({ success: true, addedCount: addedLogs.length, addedLogs })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const user = await findUserById(userId)
  if (!user) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
  }

  await clearUserLogs(userId)
  return NextResponse.json({ success: true })
}
