import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { ThumbnailGenerator } from "@/components/ThumbnailGenerator"
import { DeleteButton } from "@/components/DeleteButton"
import { RegenerateButton } from "@/components/RegenerateButton"
import { ActionButton } from "@/components/ActionButton"
import { AIPromptEditor } from "@/components/AIPromptEditor"
import { getStatusDisplay } from "@/components/StatusBadge"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminVideoDetailPage({ params }: Props) {
  const { id } = await params

  const { data: video } = await supabase.from("videos").select("*").eq("id", id).single()
  if (!video) notFound()

  const { data: transcript } = await supabase.from("transcriptions").select("*").eq("video_id", id).single()
  const { data: aiContent } = await supabase.from("ai_contents").select("*").eq("video_id", id).single()
  const { data: videoThumbnails } = await supabase.from("thumbnails").select("*").eq("video_id", id).order("created_at", { ascending: false })
  const { data: logs } = await supabase.from("ai_generation_logs").select("*").eq("video_id", id).order("created_at", { ascending: false }).limit(10)

  const step = video.processing_step ?? "none"
  const s = getStatusDisplay(video.publish_status ?? "draft", video.processing_step ?? "none")

  const steps = [
    { label: "アップロード", done: true, href: null },
    { label: "文字起こし", done: !!transcript && transcript.status === "done", href: `/admin/videos/${id}/transcript` },
    { label: "AI生成", done: !!aiContent && aiContent.status === "done", href: `/admin/videos/${id}/ai` },
    { label: "記事編集", done: !!aiContent?.article, href: `/admin/videos/${id}/article` },
    { label: "公開", done: video.publish_status === "published", href: `/admin/videos/${id}/publish` },
  ]

  const isProcessing = step !== "none" && step !== "error"

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/videos" className="text-[13px] text-gray-400 hover:text-gray-600">← 動画一覧</Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 mb-2">{video.title}</h1>
          <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${s.style}`}>{s.label}</span>
        </div>
        <div className="flex gap-2">
          {video.publish_status === "published" && (
            <Link href={`/movie/${id}`} target="_blank" className="px-4 py-2 border border-gray-200 rounded-lg text-[14px] text-gray-600 hover:bg-gray-50">
              フロントで確認 ↗
            </Link>
          )}
          <ActionButton
            videoId={id}
            publishStatus={video.publish_status ?? "draft"}
            processingStep={step}
            hasTranscript={!!transcript && transcript.status === "done"}
            hasAI={!!aiContent && aiContent.status === "done"}
            isProcessing={isProcessing}
          />
          <DeleteButton videoId={id} />
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between">
          {steps.map((st, i) => (
            <div key={st.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold ${
                  st.done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {st.done ? "✓" : i + 1}
                </div>
                {st.href ? (
                  <Link href={st.href} className="text-[12px] mt-1 text-[#cd1cfa] hover:underline">{st.label}</Link>
                ) : (
                  <span className="text-[12px] mt-1 text-gray-500">{st.label}</span>
                )}
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-[2px] mx-2 ${st.done ? "bg-green-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Prompt */}
      <div className="mb-6">
        <AIPromptEditor videoId={id} initialPrompt={video.ai_prompt ?? ""} />
      </div>

      {/* Video Info */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-[16px] font-bold text-gray-900 mb-4">動画情報</h2>
          <dl className="space-y-3">
            <div><dt className="text-[12px] text-gray-400">ID</dt><dd className="text-[14px] text-gray-700 font-mono">{video.id}</dd></div>
            <div><dt className="text-[12px] text-gray-400">ソース</dt><dd className="text-[14px] text-gray-700">{video.source_type === "youtube" ? "📺 YouTube" : "📁 ローカル"}</dd></div>
            {video.youtube_url && (
              <div><dt className="text-[12px] text-gray-400">YouTube URL</dt><dd className="text-[14px] text-blue-600 break-all"><a href={video.youtube_url} target="_blank" rel="noopener noreferrer">{video.youtube_url}</a></dd></div>
            )}
            <div><dt className="text-[12px] text-gray-400">説明</dt><dd className="text-[14px] text-gray-700">{video.description || "—"}</dd></div>
            <div><dt className="text-[12px] text-gray-400">カテゴリ</dt><dd className="text-[14px] text-gray-700">{video.category_code || "—"}</dd></div>
            {video.source_type !== "youtube" && (
              <div><dt className="text-[12px] text-gray-400">ファイルサイズ</dt><dd className="text-[14px] text-gray-700">{video.file_size ? `${(video.file_size / 1024 / 1024).toFixed(1)} MB` : "—"}</dd></div>
            )}
            <div><dt className="text-[12px] text-gray-400">作成日</dt><dd className="text-[14px] text-gray-700">{video.created_at ?? "—"}</dd></div>
            <div><dt className="text-[12px] text-gray-400">AIへの指示</dt><dd className="text-[14px] text-gray-700">{video.ai_prompt || "—"}</dd></div>
          </dl>
          {video.youtube_video_id && (
            <div className="mt-4 rounded-lg overflow-hidden border border-gray-200">
              <iframe src={`https://www.youtube.com/embed/${video.youtube_video_id}`} className="w-full aspect-video" allowFullScreen />
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-[16px] font-bold text-gray-900 mb-4">AI処理パイプライン</h2>

          {isProcessing && (
            <div className="mb-4 px-3 py-2 bg-blue-50 rounded-lg text-[13px] text-blue-700">
              ⏳ 処理中: <strong>{s.label}</strong>
            </div>
          )}
          {step === "error" && (
            <div className="mb-4 px-3 py-2 bg-red-50 rounded-lg text-[13px] text-red-600">
              ❌ エラーが発生しました
            </div>
          )}

          <div className="space-y-2">
            <PipelineRow label="文字起こし" done={!!transcript && transcript.status === "done"} active={step === "transcribing" || step === "extracting_audio"} error={!!transcript && transcript.status === "error"}>
              {transcript?.status === "done" && <Link href={`/admin/videos/${id}/transcript`} className="text-[12px] text-[#cd1cfa]">確認</Link>}
            </PipelineRow>
            <PipelineRow label="要約" done={!!aiContent?.summary} active={step === "generating_summary"}>
              {!!transcript && transcript.status === "done" && <RegenerateButton videoId={id} step="summary" />}
            </PipelineRow>
            <PipelineRow label="チャプター" done={!!aiContent?.chapters} active={step === "generating_chapters"}>
              {!!transcript && transcript.status === "done" && <RegenerateButton videoId={id} step="chapters" />}
            </PipelineRow>
            <PipelineRow label="記事" done={!!aiContent?.article} active={step === "generating_article"}>
              {!!transcript && transcript.status === "done" && (
                <span className="flex gap-2">
                  <RegenerateButton videoId={id} step="article" />
                  {aiContent?.article && <Link href={`/admin/videos/${id}/article`} className="text-[12px] text-[#cd1cfa]">確認</Link>}
                </span>
              )}
            </PipelineRow>
            <PipelineRow label="タグ" done={!!aiContent?.tags} active={step === "generating_tags"}>
              {!!transcript && transcript.status === "done" && <RegenerateButton videoId={id} step="tags" />}
            </PipelineRow>
            <PipelineRow label="サムネイル" done={(videoThumbnails ?? []).some(t => t.status === "done")} active={step === "generating_thumbnail"}>
              <span className="text-[12px] text-gray-400">{(videoThumbnails ?? []).length}枚</span>
            </PipelineRow>
          </div>

          {/* Generation Logs */}
          {logs && logs.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <p className="text-[12px] text-gray-400 mb-2">処理ログ（最新{logs.length}件）</p>
              <div className="space-y-1 max-h-[150px] overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center gap-2 text-[11px]">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${log.status === "done" ? "bg-green-500" : log.status === "error" ? "bg-red-500" : "bg-yellow-500"}`} />
                    <span className="text-gray-500 font-mono">{log.step}</span>
                    <span className="text-gray-400">{log.processing_ms ? `${(log.processing_ms / 1000).toFixed(1)}s` : ""}</span>
                    <span className="text-gray-300 truncate">{log.created_at?.slice(0, 16)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Management */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mt-6">
        <h2 className="text-[16px] font-bold text-gray-900 mb-4">サムネイル管理</h2>

        <div className="mb-4">
          <p className="text-[12px] text-gray-400 mb-2">現在のサムネイル</p>
          {video.thumbnail_path ? (
            <div className="w-[240px] aspect-video relative rounded-lg overflow-hidden bg-gray-100">
              <Image src={video.thumbnail_path} alt="サムネイル" fill className="object-cover" sizes="240px" />
            </div>
          ) : (
            <div className="w-[240px] aspect-video rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-[13px] text-gray-400">未設定</span>
            </div>
          )}
        </div>

        {videoThumbnails && videoThumbnails.length > 0 && (
          <div className="mb-4">
            <p className="text-[12px] text-gray-400 mb-2">生成済みサムネイル ({videoThumbnails.length}枚)</p>
            <div className="flex gap-3 flex-wrap">
              {videoThumbnails.map((t) => (
                <div key={t.id} className="relative group">
                  <div className={`w-[160px] aspect-video relative rounded-lg overflow-hidden bg-gray-100 ${t.is_primary ? "ring-2 ring-[#cd1cfa]" : ""}`}>
                    {t.file_path && t.status === "done" ? (
                      <Image src={t.file_path} alt="" fill className="object-cover" sizes="160px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[11px] text-gray-400">{t.status === "generating" ? "生成中..." : t.status}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {t.is_primary ? (
                      <span className="text-[10px] text-[#cd1cfa] font-semibold">✅ プライマリ</span>
                    ) : (
                      <span className="text-[10px] text-gray-400">{t.source}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 pt-4">
          <p className="text-[12px] text-gray-400 mb-2">AIサムネイル生成（GPT Images）</p>
          <ThumbnailGenerator videoId={id} videoTitle={video.title} />
        </div>
      </div>
    </div>
  )
}

function PipelineRow({ label, done, active, error, children }: { label: string; done: boolean; active?: boolean; error?: boolean; children?: React.ReactNode }) {
  const icon = active ? "⏳" : error ? "❌" : done ? "✅" : "⬜"
  const textColor = active ? "text-blue-600" : error ? "text-red-600" : done ? "text-green-600" : "text-gray-400"
  return (
    <div className="flex items-center justify-between py-1 relative">
      <div className="flex items-center gap-2">
        <span className="text-[14px]">{icon}</span>
        <span className={`text-[13px] font-medium ${textColor}`}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </div>
  )
}
