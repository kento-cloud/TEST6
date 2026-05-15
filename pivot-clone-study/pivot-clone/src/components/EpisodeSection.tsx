"use client"

import { useRef, useState, useCallback } from "react"
import { EpisodeCard } from "./EpisodeCard"
import { SectionHeader } from "./SectionHeader"
import type { Episode } from "@/types"

interface EpisodeSectionProps {
  readonly title: string
  readonly spTitle?: string
  readonly episodes: readonly Episode[]
  readonly href?: string
}

export function EpisodeSection({ title, spTitle, episodes, href }: EpisodeSectionProps) {
  const sectionId = `section-${title.replace(/\s+/g, "-")}`
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }, [])

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.8
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" })
  }

  return (
    <section aria-labelledby={sectionId}>
      <SectionHeader title={title} spTitle={spTitle} href={href} id={sectionId} />
      <div className="relative group/section">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="hidden md:flex absolute left-0 top-0 bottom-[60px] z-10 w-10 items-center justify-center bg-gradient-to-r from-black/60 to-transparent opacity-0 group-hover/section:opacity-100 transition-opacity cursor-pointer"
            aria-label="前へ"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
        )}

        {/* Cards */}
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex gap-[10px] overflow-x-auto scrollbar-hide scroll-smooth"
        >
          {episodes.map((episode) => (
            <EpisodeCard key={episode.id} episode={episode} />
          ))}
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="hidden md:flex absolute right-0 top-0 bottom-[60px] z-10 w-10 items-center justify-center bg-gradient-to-l from-black/60 to-transparent opacity-0 group-hover/section:opacity-100 transition-opacity cursor-pointer"
            aria-label="次へ"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </button>
        )}
      </div>
    </section>
  )
}
