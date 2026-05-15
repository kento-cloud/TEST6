import { NextRequest, NextResponse } from "next/server"

function handleAdminAuth(request: NextRequest, pathname: string) {
  if (pathname === "/admin-login" || pathname === "/api/admin/login") {
    return NextResponse.next()
  }

  if (pathname.startsWith("/admin")) {
    const adminSession = request.cookies.get("admin_session")
    if (!adminSession || adminSession.value !== "authenticated") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
      }
      return NextResponse.redirect(new URL("/admin-login", request.url))
    }
  }

  return NextResponse.next()
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ゲート関連・静的アセットはスキップ
  if (pathname === "/gate" || pathname === "/api/gate/login") {
    return NextResponse.next()
  }
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next()
  }

  // SITE_PASSWORD 未設定ならゲートなし
  const sitePassword = process.env.SITE_PASSWORD
  if (!sitePassword) {
    return handleAdminAuth(request, pathname)
  }

  // サイト閲覧認証
  const siteSession = request.cookies.get("site_session")
  if (!siteSession || siteSession.value !== "authenticated") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "サイト認証が必要です" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/gate", request.url))
  }

  // 管理画面認証
  return handleAdminAuth(request, pathname)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
