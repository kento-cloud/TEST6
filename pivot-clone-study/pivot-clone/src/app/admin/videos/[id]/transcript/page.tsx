import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { ManualTranscriptForm } from "@/components/ManualTranscriptForm"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

interface Segment {
  start: number
  end: number
  text: string
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default async function TranscriptPage({ params }: Props) {
  const { id } = await params
  const { data: video } = await supabase.from("videos").select("title").eq("id", id).single()
  if (!video) notFound()

  const { data: transcript } = await supabase.from("transcriptions").select("*").eq("video_id", id).single()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/videos/${id}`} className="text-[13px] text-gray-400 hover:text-gray-600">← {video.title}</Link>
      </div>

      <h1 className="text-[24px] font-bold text-gray-900 mb-6">文字起こし</h1>

      {!transcript ? (
        <ManualTranscriptForm videoId={id} />
      ) : transcript.status === "error" ? (
        <div className="bg-white rounded-xl border border-red-200 p-8">
          <p className="text-red-600 text-[15px] font-semibold mb-2">エラーが発生しました</p>
          <p className="text-red-400 text-[14px]">{transcript.error_message}</p>
        </div>
      ) : transcript.status === "processing" ? (
        <div className="bg-white rounded-xl border border-yellow-200 p-8 text-center">
          <p className="text-yellow-600 text-[15px]">文字起こし処理中...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="flex gap-4">
            <div className="bg-white rounded-xl border border-gray-100 px-5 py-3">
              <p className="text-[12px] text-gray-400">文字数</p>
              <p className="text-[20px] font-bold text-gray-900">{transcript.full_text.length.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 px-5 py-3">
              <p className="text-[12px] text-gray-400">処理時間</p>
              <p className="text-[20px] font-bold text-gray-900">{transcript.processing_ms ? `${(transcript.processing_ms / 1000).toFixed(1)}秒` : "—"}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 px-5 py-3">
              <p className="text-[12px] text-gray-400">ソース</p>
              <p className="text-[20px] font-bold text-gray-900">{transcript.source ?? "—"}</p>
            </div>
          </div>

          {/* Full Text */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-[16px] font-bold text-gray-900 mb-3">全文テキスト</h2>
            <div className="text-[14px] text-gray-700 leading-[1.8] whitespace-pre-wrap max-h-[400px] overflow-y-auto">
              {transcript.full_text}
            </div>
          </div>

          {/* Segments */}
          {transcript.segments && Array.isArray(transcript.segments) && transcript.segments.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-[16px] font-bold text-gray-900 mb-3">セグメント</h2>
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {(transcript.segments as Segment[]).map((seg, i) => (
                  <div key={i} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-[12px] text-gray-400 font-mono shrink-0 w-[100px]">
                      {formatTime(seg.start)} → {formatTime(seg.end)}
                    </span>
                    <span className="text-[14px] text-gray-700">{seg.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
