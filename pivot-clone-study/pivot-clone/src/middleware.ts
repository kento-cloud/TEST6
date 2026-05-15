import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /admin-login はスキップ（認証不要、レイアウト外）
  if (pathname === "/admin-login") {
    return NextResponse.next()
  }

  // /api/admin/login もスキップ（ログイン処理用）
  if (pathname === "/api/admin/login") {
    return NextResponse.next()
  }

  // /admin/* へのアクセスにcookie認証を要求
  if (pathname.startsWith("/admin")) {
    const session = request.cookies.get("admin_session")
    if (!session || session.value !== "authenticated") {
      // API系はJSONで401を返す
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
      }
      return NextResponse.redirect(new URL("/admin-login", request.url))
    }
  }

  // /api/videos, /api/programs 等の管理系APIも保護
  // ※ GET は公開APIとしても使えるが、mutation(POST/PUT/DELETE)はrequireAdmin()でも保護済み
  // ※ ここでは /admin/* 以外の /api/ は通す（requireAdmin()で個別保護）

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/admin-login"],
}
