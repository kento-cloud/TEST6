"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

const menuItems = [
  { label: "アカウント設定", href: "/account/setting" },
  { label: "特典交換", href: "/mile/benefit" },
] as const

const infoItems = [
  { label: "お問い合わせ", href: "/contact" },
  { label: "利用規約", href: "/terms" },
  { label: "プライバシーポリシー", href: "/privacy" },
  { label: "特定商取引法に基づく表記", href: "/asct" },
  { label: "運営会社情報", href: "/company" },
] as const

function PaddockLogoFull() {
  return (
    <Link href="/" className="inline-block">
      <img src="/assets/logo/paddock_logo.svg" alt="AI MEDIA" width={120} height={28} />
    </Link>
  )
}

export default function AccountPage() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    router.push("/")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-6 pt-6 pb-2">
        <PaddockLogoFull />
      </div>

      <div className="flex-1 flex items-start justify-center px-4 pt-8 pb-16">
        <div className="w-full max-w-[480px] bg-[#0f1d16] rounded-2xl p-6 md:p-8 border border-[#2b4034]/50">
          <h1 className="text-[22px] font-bold text-center mb-8">アカウント</h1>

          {/* ユーザー情報 */}
          {loading ? (
            <div className="text-center mb-6">
              <p className="text-[14px] text-[#5e6e63]">読み込み中...</p>
            </div>
          ) : user ? (
            <div className="mb-6 px-5 py-4 bg-[#2b4034]/40 rounded-lg">
              <p className="text-[14px] text-[#a9abb8] mb-1">ログイン中</p>
              <p className="text-[16px] font-bold">{user.user_metadata?.display_name || "ユーザー"}</p>
              <p className="text-[13px] text-[#5e6e63]">{user.email}</p>
            </div>
          ) : (
            <div className="mb-6 flex gap-3">
              <Link
                href="/auth/sign_in"
                className="flex-1 py-3 text-center bg-[#16a34a] rounded-lg text-[14px] font-bold hover:bg-[#15803d] transition-colors"
              >
                ログイン
              </Link>
              <Link
                href="/auth/sign_up"
                className="flex-1 py-3 text-center border border-[#16a34a] rounded-lg text-[14px] font-bold text-[#16a34a] hover:bg-[#16a34a]/10 transition-colors"
              >
                新規登録
              </Link>
            </div>
          )}

          <div className="flex flex-col gap-4 mb-8">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-5 h-[48px] bg-[#2b4034]/60 rounded-lg hover:bg-[#2b4034] transition-colors"
              >
                <span className="text-[15px]">{item.label}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#5e6e63"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
              </Link>
            ))}
          </div>

          <div className="flex flex-col">
            {infoItems.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-5 h-[48px] hover:bg-[#2b4034]/20 transition-colors ${
                  i < infoItems.length - 1 ? "border-b border-[#2b4034]/50" : ""
                }`}
              >
                <span className="text-[15px]">{item.label}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#5e6e63"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
              </Link>
            ))}
          </div>

          {/* ログアウト */}
          {user && (
            <button
              onClick={handleSignOut}
              className="w-full mt-6 py-3 text-center bg-[#2b4034]/60 rounded-lg text-[14px] text-red-400 hover:bg-[#2b4034] transition-colors cursor-pointer"
            >
              ログアウト
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
