"use client"

import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"

interface Props {
  readonly thumbnailUrl: string
  readonly title: string
}

/**
 * 動画詳細のサムネイルプレビュー。
 * ログイン済みの場合は非表示（AuthGate内のプレーヤーが表示されるため）。
 * 未ログインの場合にのみサムネイル+再生アイコンを表示。
 */
export function MovieThumbnailPreview({ thumbnailUrl, title }: Props) {
  const { user, loading } = useAuth()

  // ログイン済み or ローディング中は非表示
  if (user || loading) return null

  return (
    <div className="flex flex-col md:flex-row">
      <div className="w-full md:flex-1">
        <div className="relative w-full aspect-video bg-black">
          <Image src={thumbnailUrl} alt={title} fill className="object-cover" priority />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white" className="ml-1"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
