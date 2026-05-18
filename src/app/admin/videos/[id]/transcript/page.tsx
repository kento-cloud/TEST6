import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { ManualTranscriptForm } from "@/components/ManualTranscriptForm"
import { WhisperTranscribeButton } from "@/components/WhisperTranscribeButton"
import { ProcessingPoller } from "@/components/ProcessingPoller"
import { TranscriptEditor } from "@/components/TranscriptEditor"

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
  const { data: video } = await supabase.from("videos").select("title, processing_step").eq("id", id).single()
  if (!video) notFound()

  const { data: transcript } = await supabase.from("transcriptions").select("*").eq("video_id", id).single()

  const processingStep = video.processing_step ?? "none"
  const isProcessing = processingStep !== "none" && processingStep !== "error"

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/videos/${id}`} className="text-[13px] text-gray-400 hover:text-gray-600">← 動画詳細</Link>
      </div>

      <h1 className="text-[24px] font-bold text-gray-900 mb-6">文字起こし・AI生成</h1>

      {isProcessing ? (
        <div>
          <ProcessingPoller videoId={id} currentStep={processingStep} />
          <p className="text-[13px] text-gray-500 mt-2">完了すると自動的にページが更新されます。</p>
        </div>
      ) : !transcript ? (
        <div className="space-y-6">
          <WhisperTranscribeButton videoId={id} mode="full" />
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center"><span className="bg-[#f5f5f7] px-4 text-[13px] text-gray-400">または文字起こしのみ</span></div>
          </div>
          <WhisperTranscribeButton videoId={id} mode="transcribe-only" />
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center"><span className="bg-[#f5f5f7] px-4 text-[13px] text-gray-400">または手動入力</span></div>
          </div>
          <ManualTranscriptForm videoId={id} />
        </div>
      ) : transcript.status === "error" ? (
        <div className="bg-white rounded-xl border border-red-200 p-8">
          <p className="text-red-600 text-[15px] font-semibold mb-2">文字起こしでエラーが発生しました</p>
          <p className="text-red-400 text-[14px] mb-4">{transcript.error_message}</p>
          <div className="flex gap-3">
            <Link href={`/admin/videos/${id}`} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-[13px] font-semibold hover:bg-orange-700">
              動画詳細に戻ってリセット
            </Link>
          </div>
          <div className="mt-6 border-t border-gray-100 pt-4">
            <p className="text-[13px] text-gray-500 mb-2">または手動で文字起こしを入力：</p>
            <ManualTranscriptForm videoId={id} />
          </div>
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

          {/* Full Text (editable) */}
          <TranscriptEditor videoId={id} initialText={transcript.full_text} />

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
