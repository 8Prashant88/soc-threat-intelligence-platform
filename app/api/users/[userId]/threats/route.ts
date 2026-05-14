import { NextResponse } from "next/server"
import { findUserById, getUserThreats } from "@/lib/db"

export async function GET(_: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const user = await findUserById(userId)
  if (!user) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
  }

  const threats = await getUserThreats(userId)
  return NextResponse.json({ success: true, threats })
}
