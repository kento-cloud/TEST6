"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!name || !email || !password) {
      setError("すべての項目を入力してください")
      return
    }
    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください")
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
          <h1 className="text-[24px] font-bold">新規登録</h1>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="ユーザー名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-[#1d2030] rounded-lg text-white text-[15px] outline-none border border-[#303240] focus:border-[#cd1cfa]"
          />
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-[#1d2030] rounded-lg text-white text-[15px] outline-none border border-[#303240] focus:border-[#cd1cfa]"
          />
          <input
            type="password"
            placeholder="パスワード（8文字以上）"
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
            {loading ? "登録中..." : "登録する"}
          </button>
        </form>
        <p className="text-center mt-6 text-[14px] text-[#a9abb8]">
          既にアカウントをお持ちの方は <Link href="/auth/sign_in" className="text-[#cd1cfa]">ログイン</Link>
        </p>
        <div className="text-center mt-4">
          <Link href="/" className="text-[14px] text-[#606370] hover:text-white">← トップに戻る</Link>
        </div>
      </div>
    </div>
  )
}
