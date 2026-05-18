"use client"

import { useState } from "react"

interface Props {
  readonly videoId: string
  readonly thumbnailUrl: string
}

export function YouTubePlayer({ videoId, thumbnailUrl }: Props) {
  const [playing, setPlaying] = useState(false)

  if (playing) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
        className="w-full aspect-video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    )
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="relative w-full aspect-video bg-black cursor-pointer group block"
    >
      <img
        src={thumbnailUrl}
        alt=""
        className="w-full h-full object-cover"
      />
      {/* 再生ボタンオーバーレイ */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/70 flex items-center justify-center group-hover:scale-110 transition-transform">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white" className="ml-1">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </button>
  )
}
