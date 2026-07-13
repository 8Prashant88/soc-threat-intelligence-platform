import { NextResponse } from "next/server"
import { createApiKey, findUserById, listApiKeys } from "@/lib/db"

export const runtime = "nodejs"

export async function GET(_: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const user = await findUserById(userId)
  if (!user) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
  }

  const keys = await listApiKeys(userId)
  return NextResponse.json({ success: true, keys })
}

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const user = await findUserById(userId)
  if (!user) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const name = typeof body?.name === "string" ? body.name : ""

  // The plaintext key is returned here once and never again.
  const key = await createApiKey(userId, name)
  return NextResponse.json({ success: true, key })
}
