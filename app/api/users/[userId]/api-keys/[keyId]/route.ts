import { NextResponse } from "next/server"
import { findUserById, revokeApiKey } from "@/lib/db"

export const runtime = "nodejs"

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ userId: string; keyId: string }> },
) {
  const { userId, keyId } = await params
  const user = await findUserById(userId)
  if (!user) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
  }

  const revoked = await revokeApiKey(userId, keyId)
  if (!revoked) {
    return NextResponse.json({ success: false, message: "API key not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
