"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Suspense, useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"

interface Tab {
  label: string
  href: string
  code: string | null
}

function HeaderTabsInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const currentCode = searchParams.get("category_code")

  const [tabs, setTabs] = useState<Tab[]>([{ label: "トップ", href: "/", code: null }])

  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then((data: { code: string; label: string }[]) => {
        if (Array.isArray(data)) {
          setTabs([
            { label: "トップ", href: "/", code: null },
            ...data.map(c => ({
              label: c.label,
              href: `/category?category_code=${c.code}`,
              code: c.code,
            })),
          ])
        }
      })
      .catch(() => {})
  }, [])
  const isAuthPage = pathname.startsWith("/auth/")

  function isActive(tab: (typeof tabs)[number]): boolean {
    if (tab.code === null) return pathname === "/"
    return pathname === "/category" && currentCode === tab.code
  }

  return (
    <header className="sticky top-0 z-[400] w-full bg-[#0e1226]/50">
      {/* SP Header: PADDOCKロゴ + ログイン/アカウント (48px) */}
      <div className="md:hidden flex items-center justify-between h-[48px] px-4">
        <Link href="/">
          <img src="/assets/logo/paddock_logo.svg" alt="PADDOCK" width={100} height={24} />
          <span className="text-[10px] text-[#a9abb8] ml-1 whitespace-nowrap">AIで競馬を、もっと深く。</span>
        </Link>
        {user ? (
          <Link href="/account" className="text-[14px] font-bold text-white">
            {user.user_metadata?.display_name || "アカウント"}
          </Link>
        ) : !isAuthPage ? (
          <Link href="/auth/sign_in" className="text-[14px] font-bold text-white">
            ログイン
          </Link>
        ) : null}
      </div>

      {/* PC Header: タブ + 認証ボタン/アカウント (88px) */}
      <div className="hidden md:flex items-center justify-between h-[88px] px-10">
        {/* Category Tabs */}
        <div className="flex-1 relative overflow-hidden group/tabs h-[60px] flex items-center">
          <div className="flex items-center h-[56px] pb-[3px] tab-scroll">
            <div className="flex items-center rounded-lg bg-black p-[4px] w-fit shrink-0">
            {tabs.map((tab, i) => (
              <Link
                key={tab.label}
                href={tab.href}
                className={`flex items-center justify-center px-8 py-[10px] text-[16px] font-bold whitespace-nowrap transition-all rounded-lg ${
                  isActive(tab)
                    ? "bg-white"
                    : "text-[#a9abb8] hover:text-white"
                } ${i > 0 && !isActive(tab) && !isActive(tabs[i - 1]) ? "border-l border-[#303240]" : ""}`}
                style={isActive(tab) ? { color: "#0e1226" } : undefined}
              >
                {tab.label}
              </Link>
            ))}
            </div>
          </div>
        </div>

        {/* Auth Buttons / User Info */}
        <div className="flex items-center gap-3 ml-6 shrink-0">
          {user ? (
            <Link
              href="/account"
              className="flex items-center gap-2 h-[40px] px-4 text-[14px] font-bold text-white border border-white/30 rounded-full hover:bg-white/10 transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-[#16a34a] flex items-center justify-center text-[12px] font-bold">
                {(user.user_metadata?.display_name || user.email || "U")[0].toUpperCase()}
              </span>
              {user.user_metadata?.display_name || "アカウント"}
            </Link>
          ) : !isAuthPage ? (
            <>
              <Link
                href="/auth/sign_in"
                className="flex items-center justify-center w-[96px] h-[40px] text-[15px] font-bold text-white border border-white/30 rounded-full hover:bg-white/10 transition-colors"
              >
                ログイン
              </Link>
              <Link
                href="/auth/sign_up"
                className="flex items-center justify-center w-[96px] h-[40px] text-[15px] font-bold text-white gradient-button rounded-full hover:brightness-90 transition-all"
              >
                会員登録
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export function HeaderTabs() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-[400] w-full bg-[#0e1226]/50">
          <div className="h-[48px] md:h-[88px]" />
        </header>
      }
    >
      <HeaderTabsInner />
    </Suspense>
  )
}
