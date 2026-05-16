"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください")
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      router.push("/")
    }, 1000)
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <img src="/assets/logo/logo_mark.png" alt="PIVOT" width={40} height={45} className="mx-auto mb-4" />
          <h1 className="text-[24px] font-bold">ログイン</h1>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-[#1d2030] rounded-lg text-white text-[15px] outline-none border border-[#303240] focus:border-[#cd1cfa]"
          />
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-[#1d2030] rounded-lg text-white text-[15px] outline-none border border-[#303240] focus:border-[#cd1cfa]"
          />
          {error && <p className="text-red-400 text-[13px]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 gradient-button rounded-lg text-white font-bold text-[15px] mt-2 disabled:opacity-50"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
        <p className="text-center mt-6 text-[14px] text-[#a9abb8]">
          アカウントをお持ちでない方は <Link href="/auth/sign_up" className="text-[#cd1cfa]">新規登録</Link>
        </p>
        <div className="text-center mt-4">
          <Link href="/" className="text-[14px] text-[#606370] hover:text-white">← トップに戻る</Link>
        </div>
      </div>
    </div>
  )
}
