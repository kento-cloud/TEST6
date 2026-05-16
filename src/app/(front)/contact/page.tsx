"use client"

import { useState } from "react"
import Link from "next/link"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) return
    setStatus("sending")
    // 実際のメール送信APIは将来実装。現在は送信完了UIを表示。
    setTimeout(() => setStatus("sent"), 1000)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-8">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-[#a9abb8] hover:text-white mb-6"
      >
        ← 戻る
      </Link>

      <h1 className="text-2xl font-bold text-white mb-8">お問い合わせ</h1>

      {status === "sent" ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#22c55e"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
          </div>
          <h2 className="text-[20px] font-bold mb-2">送信が完了しました</h2>
          <p className="text-[14px] text-[#a9abb8] mb-6">
            お問い合わせいただきありがとうございます。<br />
            内容を確認の上、ご連絡いたします。
          </p>
          <Link href="/" className="text-[14px] text-[#cd1cfa] hover:underline">
            トップに戻る
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm text-[#a9abb8] mb-2">お名前</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田 太郎"
              required
              className="w-full bg-[#1d2030] border border-[#606370] rounded-lg px-4 py-3 text-sm text-white placeholder-[#606370] focus:outline-none focus:border-[#cd1cfa]"
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-sm text-[#a9abb8] mb-2">メールアドレス</label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              className="w-full bg-[#1d2030] border border-[#606370] rounded-lg px-4 py-3 text-sm text-white placeholder-[#606370] focus:outline-none focus:border-[#cd1cfa]"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm text-[#a9abb8] mb-2">お問い合わせ内容</label>
            <textarea
              id="message"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="お問い合わせ内容をご入力ください"
              required
              className="w-full bg-[#1d2030] border border-[#606370] rounded-lg px-4 py-3 text-sm text-white placeholder-[#606370] focus:outline-none focus:border-[#cd1cfa] resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full py-3 rounded-lg text-sm font-medium text-white disabled:opacity-50 cursor-pointer"
            style={{ background: "linear-gradient(90deg, #cd1cfa, #1e82be)" }}
          >
            {status === "sending" ? "送信中..." : "送信する"}
          </button>
        </form>
      )}
    </div>
  )
}
