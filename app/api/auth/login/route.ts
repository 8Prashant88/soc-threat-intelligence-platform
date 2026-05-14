import { NextResponse } from "next/server"
import { verifyPassword } from "@/lib/auth"
import { findUserByEmail, updateUserLastLogin } from "@/lib/db"

export async function POST(req: Request) {
  const body = await req.json()
  const email = body?.email?.toString?.()?.trim?.()
  const password = body?.password?.toString?.() ?? ""

  if (!email || !password) {
    return NextResponse.json({ success: false, message: "Missing email or password" }, { status: 400 })
  }

  const user = await findUserByEmail(email)
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 })
  }

  await updateUserLastLogin(user.id)

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      lastLogin: new Date(),
    },
  })
}
