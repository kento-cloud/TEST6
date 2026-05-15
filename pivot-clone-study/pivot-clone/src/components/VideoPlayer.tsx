"use client"

import { useRef, useState } from "react"

interface VideoPlayerProps {
  readonly src: string
  readonly poster: string
}

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)

  function handlePlay() {
    if (videoRef.current) {
      videoRef.current.play().catch(() => setError(true))
      setPlaying(true)
    }
  }

  if (error) {
    return (
      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70 text-[14px] mb-2">動画を再生できません</p>
          <p className="text-white/40 text-[12px]">ファイルが見つからないか、形式がサポートされていません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-video bg-black">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls={playing}
        playsInline
        className="w-full h-full"
        onError={() => setError(true)}
      />
      {!playing && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          aria-label="動画を再生"
        >
          <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white" className="ml-1"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </button>
      )}
    </div>
  )
}
