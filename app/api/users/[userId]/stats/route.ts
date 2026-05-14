import { NextResponse } from "next/server"
import { findUserById, getUserAttacksByDay, getUserStats, getUserTopAttackingIPs } from "@/lib/db"

export async function GET(_: Request, { params }: { params: { userId: string } }) {
  const { userId } = await params
  const user = await findUserById(userId)
  if (!user) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
  }

  const [stats, attacksByDay, topAttackingIPs] = await Promise.all([
    getUserStats(userId),
    getUserAttacksByDay(userId),
    getUserTopAttackingIPs(userId),
  ])

  return NextResponse.json({ success: true, stats, attacksByDay, topAttackingIPs })
}
