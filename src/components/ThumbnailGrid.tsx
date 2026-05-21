"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { setPrimaryThumbnail } from "@/lib/admin-api"

interface Thumbnail {
  readonly id: string
  readonly file_path: string | null
  readonly status: string
  readonly is_primary: boolean | number
  readonly source: string
}

interface Props {
  readonly videoId: string
  readonly thumbnails: Thumbnail[]
}

export function ThumbnailGrid({ videoId, thumbnails }: Props) {
  const router = useRouter()
  const [settingId, setSettingId] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  async function handleSetPrimary(thumbId: string) {
    setSettingId(thumbId)
    setMessage("")
    try {
      await setPrimaryThumbnail(videoId, thumbId)
      setMessage("メインサムネイルを変更しました")
      router.refresh()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "設定に失敗しました")
    }
    setSettingId(null)
  }

  const doneThumbs = thumbnails.filter(t => t.status === "done" && t.file_path)

  if (doneThumbs.length === 0) return null

  return (
    <div className="mb-4">
      <p className="text-[12px] text-gray-400 mb-2">生成済みサムネイル ({doneThumbs.length}枚) — クリックでメインに設定</p>
      {message && (
        <p className={`text-[11px] mb-2 ${message.includes("失敗") ? "text-red-500" : "text-green-600"}`}>{message}</p>
      )}
      <div className="flex gap-3 flex-wrap">
        {doneThumbs.map((t) => (
          <button
            key={t.id}
            onClick={() => !t.is_primary && handleSetPrimary(t.id)}
            disabled={!!t.is_primary || settingId === t.id}
            className={`relative group w-[160px] aspect-video rounded-lg overflow-hidden bg-gray-100 border-2 transition-all shrink-0 ${
              t.is_primary
                ? "border-[#16a34a] ring-2 ring-[#16a34a]/30 cursor-default"
                : "border-gray-200 hover:border-[#16a34a] cursor-pointer"
            } ${settingId === t.id ? "opacity-50" : ""}`}
          >
            <img src={t.file_path!} alt="" className="absolute inset-0 w-full h-full object-cover" />
            {t.is_primary && (
              <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-[#16a34a] rounded text-[9px] text-white font-semibold">
                メイン
              </div>
            )}
            {!t.is_primary && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <span className="text-white text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  {settingId === t.id ? "設定中..." : "メインに設定"}
                </span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-[9px] text-white text-center py-0.5">
              {t.source}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
