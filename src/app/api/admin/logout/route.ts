import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { revokeSessionToken } from "@/lib/auth"

export async function POST() {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  if (session) {
    revokeSessionToken(session.value)
  }
  cookieStore.delete("admin_session")
  return NextResponse.json({ status: "ok" })
}
