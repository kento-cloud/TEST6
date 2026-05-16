"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"

interface Props {
  readonly children: React.ReactNode
  readonly fallbackTitle?: string
}

/**
 * 未ログイン時にコンテンツをブロックし、ログイン誘導を表示する。
 * ログイン済みの場合は children をそのまま表示。
 */
export function AuthGate({ children, fallbackTitle }: Props) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="animate-spin w-6 h-6 border-2 border-[#cd1cfa] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-full max-w-[420px] bg-[#181a2e] rounded-2xl p-8 border border-[#303240]/50 text-center">
          <div className="w-16 h-16 rounded-full bg-[#cd1cfa]/10 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#cd1cfa">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
          </div>
          {fallbackTitle && (
            <p className="text-[14px] text-[#606370] mb-2">{fallbackTitle}</p>
          )}
          <h2 className="text-[20px] font-bold mb-2">会員登録でフル視聴</h2>
          <p className="text-[14px] text-[#a9abb8] mb-6">
            このコンテンツを視聴するには、ログインまたは会員登録が必要です。
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/auth/sign_up"
              className="w-full py-3 text-center gradient-button rounded-lg text-[15px] font-bold"
            >
              無料で会員登録
            </Link>
            <Link
              href="/auth/sign_in"
              className="w-full py-3 text-center border border-white/30 rounded-lg text-[15px] font-bold hover:bg-white/10 transition-colors"
            >
              ログイン
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
