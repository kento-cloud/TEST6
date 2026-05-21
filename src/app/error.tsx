"use client"

import Link from "next/link"

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#0a1a0f] flex flex-col items-center justify-center px-4">
      {/* Error icon */}
      <div className="mb-8 w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="#ef4444">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      </div>

      {/* Error message */}
      <h1 className="text-[28px] md:text-[36px] font-bold text-white mb-3">
        エラーが発生しました
      </h1>
      <p className="text-[14px] md:text-[16px] text-gray-400 text-center mb-8">
        予期しないエラーが発生しました。もう一度お試しください。
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 bg-[#16a34a] text-white rounded-lg text-[14px] font-semibold hover:bg-[#15803d] transition-colors"
        >
          もう一度試す
        </button>
        <Link
          href="/"
          className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg text-[14px] font-semibold hover:border-gray-400 hover:text-white transition-colors"
        >
          トップページへ戻る
        </Link>
      </div>
    </div>
  )
}
