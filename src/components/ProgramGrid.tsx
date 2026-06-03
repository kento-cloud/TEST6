"use client"

import Image from "next/image"
import Link from "next/link"
import { useRef, useState, useCallback } from "react"
import { SectionHeader } from "./SectionHeader"
import type { Program } from "@/types"

interface ProgramGridProps {
  readonly programs: readonly Program[]
}

export function ProgramGrid({ programs }: ProgramGridProps) {
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
    const amount = el.clientWidth * 0.6
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" })
  }

  return (
    <section>
      <SectionHeader title="番組一覧" href="/program/list" />
      <div className="relative group/programs">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="hidden md:flex absolute left-0 top-0 bottom-0 z-10 w-10 items-center justify-center bg-gradient-to-r from-black/60 to-transparent opacity-0 group-hover/programs:opacity-100 transition-opacity cursor-pointer"
            aria-label="前へ"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
        >
          {programs.map((program) => (
            <Link
              key={program.id}
              href={`/program/${program.id}`}
              className="group shrink-0 w-[100px] md:w-[120px]"
            >
              <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-[#15271c]">
                <Image
                  src={program.thumbnailUrl}
                  alt={program.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="120px"
                />
              </div>
              <p className="mt-1 text-[11px] md:text-[12px] font-bold text-center text-white line-clamp-2 leading-[1.3]">
                {program.name}
              </p>
            </Link>
          ))}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="hidden md:flex absolute right-0 top-0 bottom-0 z-10 w-10 items-center justify-center bg-gradient-to-l from-black/60 to-transparent opacity-0 group-hover/programs:opacity-100 transition-opacity cursor-pointer"
            aria-label="次へ"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </button>
        )}
      </div>
    </section>
  )
}
