"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

// ログイン必須のパス
const AUTH_REQUIRED_PATHS = new Set(["/mylist", "/action", "/account"])

/* 本家から取得した正確なアイコンSVG・サイズ */
const navItems = [
  {
    label: "ホーム",
    href: "/",
    icon: (
      <svg width="24" height="24" viewBox="0 -960 960 960" fill="currentColor">
        <path d="M240-200h133.85v-237.69h212.3V-200H720v-360L480-740.77 240-560zm-60 60v-450l300-225.77L780-590v450H526.15v-237.69h-92.3V-140zm300-330.38" />
      </svg>
    ),
  },
  {
    label: "さがす",
    href: "/search",
    icon: (
      <svg width="33" height="33" viewBox="0 0 33 33" fill="none">
        <path fill="currentColor" fillRule="evenodd" d="M15.25 21.983a6.6 6.6 0 1 0 0-13.2 6.6 6.6 0 0 0 0 13.2m0 1.734a8.333 8.333 0 1 0 0-16.667 8.333 8.333 0 0 0 0 16.667" clipRule="evenodd" />
        <path fill="currentColor" fillRule="evenodd" d="M19.995 20.128a.867.867 0 0 1 1.226 0l6.128 6.128a.867.867 0 0 1-1.226 1.226l-6.128-6.128a.867.867 0 0 1 0-1.226" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "アクション",
    href: "/action",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24">
        <path fill="currentColor" d="M19.95 15.95L18.4 14.4q1.1-1.025 1.725-2.425T20.75 9t-.625-2.95t-1.725-2.4l1.55-1.6q1.4 1.325 2.225 3.125T23 9t-.825 3.825t-2.225 3.125m-3.2-3.2l-1.6-1.6q.45-.425.725-.962T16.15 9t-.275-1.187t-.725-.963l1.6-1.6q.8.725 1.25 1.688T18.45 9T18 11.063t-1.25 1.687M9 13q-1.65 0-2.825-1.175T5 9t1.175-2.825T9 5t2.825 1.175T13 9t-1.175 2.825T9 13m-8 8v-2.8q0-.825.425-1.55t1.175-1.1q1.275-.65 2.875-1.1T9 14t3.525.45t2.875 1.1q.75.375 1.175 1.1T17 18.2V21zm2-2h12v-.8q0-.275-.137-.5t-.363-.35q-.9-.45-2.312-.9T9 16t-3.187.45t-2.313.9q-.225.125-.363.35T3 18.2zm7.413-8.587Q11 9.825 11 9t-.587-1.412T9 7t-1.412.588T7 9t.588 1.413T9 11t1.413-.587M9 19" />
      </svg>
    ),
  },
  {
    label: "マイリスト",
    href: "/mylist",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path fill="currentColor" d="m10.542 18.218-3.308 1.42q-.754.321-1.431-.124-.678-.445-.678-1.253V8.09q0-.631.438-1.07a1.45 1.45 0 0 1 1.068-.437h7.82q.633 0 1.07.438t.437 1.069V18.26q0 .808-.678 1.253t-1.43.124zm0-1.385 3.806 1.64q.128.056.244-.024a.25.25 0 0 0 .116-.217V8.09a.25.25 0 0 0-.08-.177.25.25 0 0 0-.176-.08h-7.82a.25.25 0 0 0-.177.08.25.25 0 0 0-.08.177v10.142q0 .136.116.217a.24.24 0 0 0 .245.024zm7.083 1.209V5.173a.25.25 0 0 0-.08-.176.25.25 0 0 0-.177-.08H7.626v-1.25h9.744q.63 0 1.068.437t.438 1.07v12.868zM10.542 7.833H6.375h8.333z" />
      </svg>
    ),
  },
  {
    label: "アカウント",
    href: "/account",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path fill="currentColor" d="M6.625 16.688q1.313-.834 2.594-1.26A8.8 8.8 0 0 1 12 15q1.5 0 2.792.427 1.29.427 2.604 1.26.916-1.125 1.302-2.27A7.5 7.5 0 0 0 19.083 12q0-3.021-2.031-5.052T12 4.917t-5.052 2.03Q4.917 8.98 4.917 12q0 1.27.395 2.417.396 1.145 1.313 2.27m5.371-4.063q-1.205 0-2.027-.827t-.823-2.031.827-2.027q.826-.823 2.03-.823 1.206 0 2.028.826.823.828.823 2.032t-.827 2.027q-.826.823-2.03.823m-.005 7.708a8.1 8.1 0 0 1-3.255-.656 8.3 8.3 0 0 1-2.65-1.792 8.4 8.4 0 0 1-1.774-2.653 8.2 8.2 0 0 1-.645-3.242q0-1.726.656-3.243a8.3 8.3 0 0 1 1.792-2.643 8.6 8.6 0 0 1 2.652-1.781 8.1 8.1 0 0 1 3.243-.656q1.726 0 3.243.656a8.4 8.4 0 0 1 2.643 1.781 8.4 8.4 0 0 1 1.781 2.646 8.1 8.1 0 0 1 .656 3.245 8.1 8.1 0 0 1-.656 3.239 8.6 8.6 0 0 1-1.781 2.651 8.3 8.3 0 0 1-2.649 1.792 8.1 8.1 0 0 1-3.255.656" />
      </svg>
    ),
  },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  function getHref(item: (typeof navItems)[number]): string {
    if (!user && AUTH_REQUIRED_PATHS.has(item.href)) {
      return "/auth/sign_in"
    }
    return item.href
  }

  return (
    <>
      {/* PC Sidebar */}
      <aside className="hidden md:flex flex-col w-[72px] min-w-[72px] h-screen bg-[#0e1226] fixed left-0 top-0 z-[500]">
        <div className="flex flex-col items-center w-full">
          <Link href="/" className="flex h-[66px] w-full items-center justify-center">
            <img
              src="/assets/logo/logo_mark.png"
              alt="PIVOT"
              width={22}
              height={25}
              className="object-contain"
            />
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={getHref(item)}
              className={`flex flex-col items-center justify-center gap-[4px] w-[72px] h-[66px] transition-colors ${
                isActive(item.href) ? "text-white" : "text-[#a9abb8] hover:text-white"
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-bold leading-none">{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="mt-auto mb-4 flex justify-center">
          <Link href="/admin" className="w-6 h-6 opacity-0 hover:opacity-30 transition-opacity" aria-label="Admin" />
        </div>
      </aside>

      {/* SP Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[500] flex items-center bg-[#0e1226] border-t border-[#606370]/40">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={getHref(item)}
            className={`flex-1 flex flex-col items-center justify-center gap-[3px] h-[60px] transition-colors ${
              isActive(item.href) ? "text-white" : "text-[#a9abb8]"
            }`}
          >
            {item.icon}
            <span className="text-[9px] font-bold leading-none">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
