"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function GatePage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [state, setState] = useState<"idle" | "loading" | "error">("idle")
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState("loading")
    setError("")

    try {
      const res = await fetch("/api/gate/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error ?? "認証に失敗しました")
      }

      router.push("/")
      router.refresh()
    } catch (err) {
      setState("error")
      setError(err instanceof Error ? err.message : "認証に失敗しました")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3d084a] to-[#092638] flex items-center justify-center px-4">
      <main className="w-full max-w-[360px] text-center">
        <div className="mb-8">
          <p className="text-[14px] text-gray-400">閲覧にはパスワードが必要です</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            disabled={state === "loading"}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-[15px] text-white placeholder-gray-400 outline-none focus:border-[#cd1cfa] transition-colors disabled:opacity-50"
            autoFocus
          />

          {state === "error" && (
            <p className="text-red-400 text-[13px]" role="alert">{error}</p>
          )}

          <button
            type="submit"
            disabled={state === "loading" || !password}
            className="w-full py-3 bg-gradient-to-r from-[#cd1cfa] to-[#1e82be] text-white rounded-lg text-[15px] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {state === "loading" ? (
              <span className="inline-flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                確認中
              </span>
            ) : "入る"}
          </button>
        </form>
      </main>
    </div>
  )
}
