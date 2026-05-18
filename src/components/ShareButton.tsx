"use client"
import { useState, useRef, useEffect } from "react"

interface Props {
  readonly title: string
  readonly url?: string
}

export function ShareButton({ title, url }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "")

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  async function handleShare() {
    if (navigator.share) {
      try { await navigator.share({ title, url: shareUrl }); return } catch { /* user cancelled */ }
    }
    setOpen(!open)
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => { setCopied(false); setOpen(false) }, 1500)
  }

  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleShare} className="flex items-center gap-1 text-[13px] text-[#999] hover:text-white transition-colors cursor-pointer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        シェア
      </button>
      {open && (
        <div className="absolute left-0 bottom-full mb-2 bg-[#1d2030] border border-[#303240] rounded-lg shadow-lg py-1 z-50 w-[180px]">
          <button onClick={handleCopy} className="w-full px-4 py-2 text-left text-[13px] text-white hover:bg-[#303240] cursor-pointer">
            {copied ? "コピーしました" : "リンクをコピー"}
          </button>
          <a href={xUrl} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-[13px] text-white hover:bg-[#303240]">
            Xでシェア
          </a>
          <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-[13px] text-white hover:bg-[#303240]">
            LINEでシェア
          </a>
        </div>
      )}
    </div>
  )
}
