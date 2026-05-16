"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { label: "ダッシュボード", href: "/admin", icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
  { label: "動画管理", href: "/admin/videos", icon: "M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" },
  { label: "番組管理", href: "/admin/programs", icon: "M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z" },
  { label: "サムネテンプレ", href: "/admin/thumbnail-presets", icon: "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" },
  { label: "生成履歴", href: "/admin/generation-logs", icon: "M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" },
  { label: "処理キュー", href: "/admin/queue", icon: "M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z" },
  { label: "設定", href: "/admin/settings", icon: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" },
] as const

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  function isActive(href: string): boolean {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-screen bg-[#f5f5f7]">
      {/* Sidebar */}
      <aside className="w-[240px] min-w-[240px] bg-white border-r border-gray-200 fixed h-screen flex flex-col">
        <div className="h-[60px] flex items-center px-5 border-b border-gray-100">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-[18px] font-black bg-gradient-to-r from-[#cd1cfa] to-[#1e82be] bg-clip-text text-transparent">PIVOT</span>
            <span className="text-[13px] font-semibold text-gray-400">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 py-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-[10px] text-[14px] transition-colors ${
                isActive(item.href)
                  ? "text-[#cd1cfa] bg-purple-50 font-semibold border-r-2 border-[#cd1cfa]"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d={item.icon} /></svg>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100 space-y-2">
          <a href="/" target="_blank" rel="noopener noreferrer" className="text-[13px] text-blue-500 hover:text-blue-700 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
            サイトを表示
          </a>
          <LogoutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-[240px] p-6">
        {children}
      </main>
    </div>
  )
}

function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    window.location.href = "/admin-login"
  }

  return (
    <button
      onClick={handleLogout}
      className="text-[13px] text-red-400 hover:text-red-600 flex items-center gap-1 cursor-pointer"
    >
      ログアウト
    </button>
  )
}
