import { NextResponse } from "next/server"
import { createUser, findUserByEmail } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

export async function POST(req: Request) {
  const body = await req.json()
  const name = body?.name?.toString?.()?.trim?.()
  const email = body?.email?.toString?.()?.trim?.()?.toLowerCase?.()
  const password = body?.password?.toString?.() ?? ""

  if (!name || !email || !password) {
    return NextResponse.json({ success: false, message: "Missing signup information" }, { status: 400 })
  }

  const existingUser = await findUserByEmail(email)
  if (existingUser) {
    return NextResponse.json({ success: false, message: "An account with this email already exists" }, { status: 409 })
  }

  const user = await createUser({
    name,
    email,
    passwordHash: hashPassword(password),
  })

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    },
  })
}
