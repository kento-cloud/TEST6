"use client"
import { useState, useEffect } from "react"

export function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    function handleScroll() { setShow(window.scrollY > 500) }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!show) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-20 md:bottom-8 right-4 w-10 h-10 bg-[#15271c] border border-[#2b4034] rounded-full flex items-center justify-center text-white hover:bg-[#2b4034] transition-colors cursor-pointer z-40 shadow-lg"
      aria-label="トップに戻る"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  )
}
