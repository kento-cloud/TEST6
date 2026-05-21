"use client"

import Link from "next/link"
import { AuthGate } from "@/components/AuthGate"

export default function WatchLaterPage() {
  return (
    <AuthGate>
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-[#a9abb8] hover:text-white mb-6"
        >
          ← 戻る
        </Link>

        <h1 className="text-2xl font-bold text-white mb-8">あとで見る</h1>

        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 opacity-10">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <rect width="80" height="80" rx="16" fill="white" />
              <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="#0e1226" fontSize="20" fontWeight="bold" fontFamily="sans-serif">PADDOCK</text>
            </svg>
          </div>
          <p className="text-[#a9abb8] text-sm mb-6">
            あとで見るに追加した動画が表示されます
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-sm font-medium text-white"
            style={{ background: "linear-gradient(90deg, #16a34a, #d4a017)" }}
          >
            ホームで探す
          </Link>
        </div>
      </div>
    </AuthGate>
  )
}
