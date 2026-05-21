"use client"

import { ArticleExport } from "@/components/ArticleExport"

interface ArticleViewProps {
  readonly article: string | null
  readonly title: string
}

export function ArticleView({ article, title }: ArticleViewProps) {
  if (!article) {
    return (
      <div className="bg-[#1d2030] rounded-xl p-8 mb-6 text-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="#606370" className="mx-auto mb-3">
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
        </svg>
        <p className="text-[#606370] text-[14px]">記事はまだ生成されていません</p>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#16a34a">
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm2-6h8v2H8v-2zm0-3h8v2H8v-2z" />
          </svg>
          <span className="text-[13px] text-[#a9abb8]">AI生成記事</span>
        </div>
        <ArticleExport article={article} title={title} />
      </div>
      <div className="bg-[#1d2030] rounded-xl p-6 text-[15px] text-[#a9abb8] leading-[1.9]">
        {article.split("\n").map((line: string, i: number) => {
          if (line.startsWith("## ")) return <h3 key={i} className="text-[17px] font-bold text-white mt-5 mb-2">{line.slice(3)}</h3>
          if (line.startsWith("### ")) return <h4 key={i} className="text-[15px] font-bold text-white mt-4 mb-1">{line.slice(4)}</h4>
          if (line.startsWith("- ")) return <li key={i} className="ml-4 mb-1">{line.slice(2)}</li>
          if (line.trim() === "") return <br key={i} />
          return <p key={i} className="mb-2">{line}</p>
        })}
      </div>
    </div>
  )
}
