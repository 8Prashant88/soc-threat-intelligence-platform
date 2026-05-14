import { NextResponse } from "next/server"
import { deleteUserLog, findUserById } from "@/lib/db"

export async function DELETE(_: Request, { params }: { params: Promise<{ userId: string; logId: string }> }) {
  const { userId, logId } = await params
  const user = await findUserById(userId)
  if (!user) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
  }

  const deleted = await deleteUserLog(userId, logId)
  if (!deleted) {
    return NextResponse.json({ success: false, message: "Log not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
