"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { login } from "@/lib/admin-api"

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [state, setState] = useState<"idle" | "loading" | "error">("idle")
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState("loading")
    setError("")

    try {
      await login(password)
      router.push("/admin")
      router.refresh()
    } catch (err) {
      setState("error")
      setError(err instanceof Error ? err.message : "認証に失敗しました")
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4">
      <main className="w-full max-w-[380px] bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <header className="text-center mb-8">
          <h1 className="inline-flex items-baseline gap-2">
            <span className="text-[24px] font-black bg-gradient-to-r from-[#cd1cfa] to-[#1e82be] bg-clip-text text-transparent">PIVOT</span>
            <span className="text-[14px] font-semibold text-gray-400">Admin</span>
          </h1>
          <p className="text-[14px] text-gray-500 mt-2">管理画面にログイン</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-[13px] font-semibold text-gray-700 mb-1">パスワード</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="管理者パスワード"
              disabled={state === "loading"}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[15px] text-gray-900 outline-none focus:border-[#cd1cfa] transition-colors disabled:bg-gray-50"
              autoFocus
            />
          </div>

          {state === "error" && <p className="text-red-500 text-[13px] mb-4" role="alert">{error}</p>}

          <button
            type="submit"
            disabled={state === "loading" || !password}
            className="w-full py-3 bg-[#cd1cfa] text-white rounded-lg text-[15px] font-semibold hover:bg-[#b018d8] disabled:opacity-50 transition-colors"
          >
            {state === "loading" ? (
              <span className="inline-flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ログイン中
              </span>
            ) : "ログイン"}
          </button>
        </form>
      </main>
    </div>
  )
}
