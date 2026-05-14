import { NextResponse } from "next/server"
import { findUserById, updateAlertStatus } from "@/lib/db"

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string; alertId: string }> }) {
  const { userId, alertId } = await params
  const body = await req.json()
  const status = body?.status?.toString?.() as "new" | "acknowledged" | "resolved"

  if (!status) {
    return NextResponse.json({ success: false, message: "Missing status" }, { status: 400 })
  }

  const user = await findUserById(userId)
  if (!user) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
  }

  const updated = await updateAlertStatus(userId, alertId, status)
  if (!updated) {
    return NextResponse.json({ success: false, message: "Alert not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
