"use client"

import { useRef, useState, useEffect, useCallback } from "react"

interface AudioPlayerProps {
  readonly src: string
  readonly thumbnailUrl: string
  readonly title: string
  readonly programName?: string
}

export function AudioPlayer({ src, thumbnailUrl, title, programName }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    function handleTimeUpdate() {
      setCurrentTime(audio!.currentTime)
    }
    function handleLoadedMetadata() {
      setDuration(audio!.duration)
    }
    function handleEnded() {
      setPlaying(false)
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().catch(() => setError(true))
      setPlaying(true)
    }
  }, [playing])

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current
    if (!audio) return
    const time = Number(e.target.value)
    audio.currentTime = time
    setCurrentTime(time)
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  if (error) {
    return (
      <div className="bg-[#15271c] rounded-xl p-8 flex items-center justify-center">
        <p className="text-[#5e6e63] text-[14px]">音声を再生できません</p>
      </div>
    )
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-[#15271c] rounded-xl p-6 mb-6">
      <audio ref={audioRef} src={src} preload="metadata" onError={() => setError(true)} />

      {/* Artwork */}
      <div className="max-w-[320px] mx-auto mb-6">
        <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl">
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-5">
        {programName && (
          <p className="text-[12px] text-[#16a34a] font-bold mb-1">{programName}</p>
        )}
        <h3 className="text-[15px] font-bold text-white leading-snug line-clamp-2">{title}</h3>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="relative h-1 bg-[#2b4034] rounded-full overflow-hidden mb-2">
          <div
            className="absolute left-0 top-0 h-full bg-[#16a34a] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="absolute opacity-0 w-full cursor-pointer"
          style={{ marginTop: "-12px", height: "20px" }}
        />
        <div className="flex justify-between text-[11px] text-[#5e6e63]">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-8">
        {/* Rewind 15s */}
        <button
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15)
            }
          }}
          className="text-[#a9abb8] hover:text-white transition-colors cursor-pointer"
          aria-label="15秒戻る"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            <text x="10" y="16" fontSize="7" textAnchor="middle" fill="currentColor">15</text>
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="w-14 h-14 bg-[#16a34a] rounded-full flex items-center justify-center hover:bg-[#15803d] transition-colors cursor-pointer"
          aria-label={playing ? "一時停止" : "再生"}
        >
          {playing ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Forward 15s */}
        <button
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 15)
            }
          }}
          className="text-[#a9abb8] hover:text-white transition-colors cursor-pointer"
          aria-label="15秒進む"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
            <text x="14" y="16" fontSize="7" textAnchor="middle" fill="currentColor">15</text>
          </svg>
        </button>
      </div>
    </div>
  )
}
