import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a1a0f] flex flex-col items-center justify-center px-4">
      {/* Horse silhouette icon */}
      <svg
        width="80"
        height="80"
        viewBox="0 0 200 200"
        fill="none"
        className="mb-8 opacity-30"
      >
        <path
          d="M140 30c-5 0-10 3-13 7l-3 5c-2 0-4 1-6 3l-8 10c-3 4-5 8-5 13v8l-5 8c-2 3-3 7-3 11v15c0 3 1 6 3 8l-8 12c-2 3-3 7-3 10v10c0 4 2 7 5 9l5 3v8c0 5 4 9 9 9h4c5 0 9-4 9-9v-12l10-8 15 2v18c0 5 4 9 9 9h4c5 0 9-4 9-9v-25l8-15c3-5 4-11 4-17v-20c0-8-3-15-8-21l-5-6c0-4-1-8-4-11l-7-9c-4-5-10-8-16-8h-5z"
          fill="#16a34a"
        />
      </svg>

      {/* 404 text */}
      <h1 className="text-[120px] md:text-[160px] font-extrabold text-[#16a34a] leading-none tracking-tight font-[Inter,sans-serif] opacity-80">
        404
      </h1>

      {/* Message */}
      <p className="mt-4 text-[16px] md:text-[18px] text-gray-400 text-center">
        お探しのページが見つかりませんでした
      </p>

      {/* Back to home link */}
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-[#16a34a] text-white rounded-lg text-[14px] font-semibold hover:bg-[#15803d] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
        トップページへ戻る
      </Link>
    </div>
  )
}
