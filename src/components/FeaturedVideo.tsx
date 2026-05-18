"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { AuthPrompt } from "@/components/AuthPrompt"

export interface FeaturedItem {
  readonly id: string
  readonly title: string
  readonly subtitle: string
  readonly description: string
  readonly thumbnailUrl: string
  readonly programLogoUrl: string
  readonly youtubeVideoId?: string | null
}

interface FeaturedVideoProps {
  readonly items: readonly FeaturedItem[]
}

export function FeaturedVideo({ items }: FeaturedVideoProps) {
  const featuredItems = items
  const [current, setCurrent] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [videoReady, setVideoReady] = useState(false)

  const goTo = useCallback((index: number) => {
    setCurrent(index)
  }, [])

  // Reset to 0 when items change
  useEffect(() => {
    setCurrent(0)
    setVideoReady(false)
  }, [items])

  // スライド変更時: サムネ4秒表示→動画フェードイン（4秒待つことでYouTubeの初期UIが消えてから表示）
  useEffect(() => {
    setVideoReady(false)
    const timer = setTimeout(() => setVideoReady(true), 4000)
    return () => clearTimeout(timer)
  }, [current])

  useEffect(() => {
    if (featuredItems.length === 0) return
    if (hovered) return // ホバー中はスライド停止
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % featuredItems.length)
    }, 10000)
    return () => clearInterval(timer)
  }, [featuredItems.length, hovered])

  if (featuredItems.length === 0) return null

  const item = featuredItems[current]
  if (!item) return null

  return (
    <section className="w-full">
      {/* PC Layout */}
      <div className="hidden md:flex flex-row w-full">
        <div className="flex flex-col justify-center items-start shrink-0 w-[32%] lg:w-[35%] xl:w-[380px] px-6 lg:px-8 py-8">
          {item.programLogoUrl && (
            <div className="w-full max-w-[300px] mb-4">
              <Image src={item.programLogoUrl} alt={item.subtitle} width={300} height={50} className="w-full h-auto" />
            </div>
          )}
          <h2 className="text-[20px] lg:text-[22px] xl:text-[24px] font-bold mb-2 leading-[1.4] text-white">
            {item.title}
          </h2>
          <p className="text-[13px] lg:text-[14px] font-normal leading-[1.7] text-[#a9abb8] line-clamp-3 mb-6">
            {item.description}
          </p>
          <AuthPrompt>
          <Link
            href={`/movie/${item.id}`}
            className="flex items-center justify-center gap-1 w-[200px] h-[48px] rounded-[24px] bg-white border-2 border-white font-semibold text-[16px] hover:bg-white/90 transition-colors"
            style={{ color: "#000" }}
          >
            視聴する
            <span className="flex items-center justify-center w-[28px] h-[28px] rounded-full bg-black">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
            </span>
          </Link>
          </AuthPrompt>
          <div className="flex items-center gap-[4px] mt-6">
            {featuredItems.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} className="py-2 cursor-pointer group/dot" aria-label={`スライド ${i + 1}`}>
                <div className={`h-[3px] rounded-full transition-all duration-300 ${
                  i === current ? "w-[24px] bg-white" : "w-[14px] bg-white/30 group-hover/dot:bg-white/50"
                }`} />
              </button>
            ))}
          </div>
        </div>
        <div
          className="flex-1"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <AuthPrompt>
          <Link href={`/movie/${item.id}`} className="block">
            <div className="relative w-full aspect-video overflow-hidden bg-[#111]">
              {/* サムネイル（常に下に表示） */}
              <Image src={item.thumbnailUrl} alt={item.title} fill className="object-cover" priority sizes="65vw" />
              {/* YouTube動画（3秒後にフェードイン） */}
              {item.youtubeVideoId && (
                <>
                  <iframe
                    src={`https://www.youtube.com/embed/${item.youtubeVideoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&showinfo=0&loop=1&playlist=${item.youtubeVideoId}&iv_load_policy=3&disablekb=1&fs=0`}
                    className={`absolute inset-0 w-full h-full z-10 pointer-events-none transition-opacity duration-1000 ${videoReady ? "opacity-100" : "opacity-0"}`}
                    allow="autoplay; encrypted-media"
                    tabIndex={-1}
                  />
                  {/* 透明オーバーレイ（YouTubeの操作を遮断） */}
                  <div className="absolute inset-0 z-20" />
                </>
              )}
            </div>
          </Link>
          </AuthPrompt>
        </div>
      </div>

      {/* SP Layout */}
      <div className="md:hidden">
        <AuthPrompt>
        <Link href={`/movie/${item.id}`} className="block">
          <div className="relative w-full aspect-video overflow-hidden bg-[#111]">
            <Image src={item.thumbnailUrl} alt={item.title} fill className="object-cover" priority sizes="100vw" />
          </div>
        </Link>
        </AuthPrompt>
        {/* SP: タイトル左 + 視聴する右（本家と同じ横並び） */}
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-[16px] font-bold leading-[1.3] text-white line-clamp-1 flex-1 mr-3">{item.title}</h2>
          <AuthPrompt>
          <Link
            href={`/movie/${item.id}`}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-white/50 text-white font-bold text-[13px] shrink-0"
          >
            視聴する
          </Link>
          </AuthPrompt>
        </div>
        {/* SP Indicators */}
        <div className="flex items-center gap-[4px] px-4 pb-3">
          {featuredItems.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} className="py-2 cursor-pointer" aria-label={`スライド ${i + 1}`}>
              <div className={`h-[3px] rounded-full transition-all duration-300 ${
                i === current ? "w-[20px] bg-white" : "w-[12px] bg-white/30"
              }`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
