"use client"
import { useState } from "react"

interface Props {
  readonly article: string
  readonly title: string
}

export function ArticleExport({ article, title }: Props) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const text = `${title}\n\n${article.replace(/##\s/g, "■ ").replace(/###\s/g, "● ").replace(/- /g, "・")}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleCopyMarkdown() {
    navigator.clipboard.writeText(`# ${title}\n\n${article}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex gap-2">
      <button onClick={handleCopy} className="text-[12px] text-[#606370] hover:text-white transition-colors cursor-pointer">
        {copied ? "コピー済み" : "テキストをコピー"}
      </button>
      <span className="text-[#303240]">|</span>
      <button onClick={handleCopyMarkdown} className="text-[12px] text-[#606370] hover:text-white transition-colors cursor-pointer">
        Markdownでコピー
      </button>
    </div>
  )
}
