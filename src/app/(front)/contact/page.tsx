import Link from "next/link"

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-8">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-[#a9abb8] hover:text-white mb-6"
      >
        ← 戻る
      </Link>

      <h1 className="text-2xl font-bold text-white mb-8">お問い合わせ</h1>

      <div className="bg-[#112019] rounded-2xl border border-[#2b4034]/50 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[#2b4034] flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a9abb8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <p className="text-[16px] font-bold text-white mb-3">
          お問い合わせ機能は現在準備中です。
        </p>
        <p className="text-[14px] text-[#a9abb8] mb-6 leading-relaxed">
          ご質問はメールにてお問い合わせください。
        </p>
        <a
          href="mailto:support@aimedia.jp"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-[14px] font-medium text-white hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(90deg, #16a34a, #4ade80)" }}
        >
          support@aimedia.jp
        </a>
      </div>
    </div>
  )
}
