"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

/**
 * 未ログイン時にコンテンツクリックで登録促進モーダルを表示する。
 * ログイン済みの場合はそのまま遷移させる。
 *
 * 使い方: カードの親要素をこのコンポーネントでラップする。
 * <AuthPrompt><EpisodeCard ... /></AuthPrompt>
 */
export function AuthPrompt({ children }: { readonly children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [show, setShow] = useState(false)

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (loading) return
    if (user) return // ログイン済み → そのまま遷移

    // 未ログイン → リンク遷移を止めてモーダル表示
    e.preventDefault()
    e.stopPropagation()
    setShow(true)
  }, [user, loading])

  return (
    <>
      <div onClick={handleClick} className="contents">
        {children}
      </div>

      {show && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShow(false)}
        >
          <div
            className="w-full max-w-[420px] mx-4 bg-[#181a2e] rounded-2xl p-8 border border-[#303240]/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#cd1cfa]/10 flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#cd1cfa">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <h2 className="text-[20px] font-bold mb-2">コンテンツを視聴するには</h2>
              <p className="text-[14px] text-[#a9abb8] mb-6">
                無料の会員登録で、すべての動画・記事をお楽しみいただけます。
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/auth/sign_up"
                  className="w-full py-3 text-center gradient-button rounded-lg text-[15px] font-bold block"
                  onClick={() => setShow(false)}
                >
                  無料で会員登録
                </Link>
                <Link
                  href="/auth/sign_in"
                  className="w-full py-3 text-center border border-white/30 rounded-lg text-[15px] font-bold hover:bg-white/10 transition-colors block"
                  onClick={() => setShow(false)}
                >
                  ログイン
                </Link>
              </div>
              <button
                onClick={() => setShow(false)}
                className="mt-4 text-[13px] text-[#606370] hover:text-white transition-colors cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
