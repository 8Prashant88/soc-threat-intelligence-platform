import { NextResponse } from "next/server"
import { findUserById, getUserAlerts } from "@/lib/db"

export async function GET(_: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const user = await findUserById(userId)
  if (!user) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
  }

  const alerts = await getUserAlerts(userId)
  return NextResponse.json({ success: true, alerts })
}
