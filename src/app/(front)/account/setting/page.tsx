"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthGate } from "@/components/AuthGate"
import { useAuth } from "@/contexts/AuthContext"
import { createBrowserClient } from "@/lib/supabase-browser"

export default function AccountSettingPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  // ニックネーム
  const [nickname, setNickname] = useState(user?.user_metadata?.display_name || "")
  const [nickSaving, setNickSaving] = useState(false)
  const [nickMsg, setNickMsg] = useState("")

  // メールアドレス
  const [email, setEmail] = useState(user?.email || "")
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailMsg, setEmailMsg] = useState("")

  // パスワード
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState("")

  async function handleNickname() {
    if (!nickname.trim()) return
    setNickSaving(true)
    setNickMsg("")
    const supabase = createBrowserClient()
    const { error } = await supabase.auth.updateUser({
      data: { display_name: nickname.trim() },
    })
    setNickSaving(false)
    setNickMsg(error ? error.message : "変更しました")
  }

  async function handleEmail() {
    if (!email.trim() || email === user?.email) return
    setEmailSaving(true)
    setEmailMsg("")
    const supabase = createBrowserClient()
    const { error } = await supabase.auth.updateUser({ email: email.trim() })
    setEmailSaving(false)
    setEmailMsg(error ? error.message : "確認メールを送信しました")
  }

  async function handlePassword() {
    setPwMsg("")
    if (!newPassword || newPassword.length < 8) {
      setPwMsg("パスワードは8文字以上で入力してください")
      return
    }
    if (newPassword !== confirmPassword) {
      setPwMsg("パスワードが一致しません")
      return
    }
    setPwSaving(true)
    const supabase = createBrowserClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwSaving(false)
    if (error) {
      setPwMsg(error.message)
    } else {
      setPwMsg("パスワードを変更しました")
      setNewPassword("")
      setConfirmPassword("")
    }
  }

  async function handleSignOut() {
    await signOut()
    router.push("/")
  }

  return (
    <AuthGate>
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-8">
        <Link
          href="/account"
          className="inline-flex items-center text-sm text-[#a9abb8] hover:text-white mb-6"
        >
          ← 戻る
        </Link>

        <h1 className="text-2xl font-bold text-white mb-8">アカウント設定</h1>

        <div className="space-y-6">
          {/* ニックネーム */}
          <div className="border border-[#2b4034] rounded-lg p-5">
            <label htmlFor="nickname" className="block text-sm text-[#a9abb8] mb-2">ニックネーム</label>
            <div className="flex gap-3">
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="flex-1 bg-[#15271c] rounded px-4 py-3 text-sm text-white outline-none border border-[#2b4034] focus:border-[#16a34a]"
              />
              <button
                onClick={handleNickname}
                disabled={nickSaving}
                className="px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-bold hover:bg-[#15803d] disabled:opacity-50 cursor-pointer shrink-0"
              >
                {nickSaving ? "保存中..." : "変更"}
              </button>
            </div>
            {nickMsg && <p className={`text-[12px] mt-2 ${nickMsg.includes("しました") ? "text-green-400" : "text-red-400"}`}>{nickMsg}</p>}
          </div>

          {/* メールアドレス */}
          <div className="border border-[#2b4034] rounded-lg p-5">
            <label htmlFor="email" className="block text-sm text-[#a9abb8] mb-2">メールアドレス</label>
            <div className="flex gap-3">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-[#15271c] rounded px-4 py-3 text-sm text-white outline-none border border-[#2b4034] focus:border-[#16a34a]"
              />
              <button
                onClick={handleEmail}
                disabled={emailSaving || email === user?.email}
                className="px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-bold hover:bg-[#15803d] disabled:opacity-50 cursor-pointer shrink-0"
              >
                {emailSaving ? "送信中..." : "変更"}
              </button>
            </div>
            {emailMsg && <p className={`text-[12px] mt-2 ${emailMsg.includes("送信") || emailMsg.includes("しました") ? "text-green-400" : "text-red-400"}`}>{emailMsg}</p>}
          </div>

          {/* パスワード変更 */}
          <div className="border border-[#2b4034] rounded-lg p-5">
            <label htmlFor="new-password" className="block text-sm text-[#a9abb8] mb-2">パスワード変更</label>
            <div className="space-y-3">
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="新しいパスワード（8文字以上）"
                className="w-full bg-[#15271c] rounded px-4 py-3 text-sm text-white outline-none border border-[#2b4034] focus:border-[#16a34a]"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="新しいパスワード（確認）"
                className="w-full bg-[#15271c] rounded px-4 py-3 text-sm text-white outline-none border border-[#2b4034] focus:border-[#16a34a]"
              />
              <button
                onClick={handlePassword}
                disabled={pwSaving || !newPassword}
                className="px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-bold hover:bg-[#15803d] disabled:opacity-50 cursor-pointer"
              >
                {pwSaving ? "変更中..." : "パスワードを変更"}
              </button>
            </div>
            {pwMsg && <p className={`text-[12px] mt-2 ${pwMsg.includes("しました") ? "text-green-400" : "text-red-400"}`}>{pwMsg}</p>}
          </div>

          {/* ログアウト */}
          <div className="pt-4">
            <button
              onClick={handleSignOut}
              className="w-full border border-red-500 text-red-500 rounded-lg py-3 text-sm font-medium hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </AuthGate>
  )
}
