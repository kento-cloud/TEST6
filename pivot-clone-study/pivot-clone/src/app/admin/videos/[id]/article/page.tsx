import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params
  const { data: video } = await supabase.from("videos").select("title").eq("id", id).single()
  if (!video) notFound()

  const { data: aiContent } = await supabase.from("ai_contents").select("article").eq("video_id", id).single()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/videos/${id}`} className="text-[13px] text-gray-400 hover:text-gray-600">← {video.title}</Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-bold text-gray-900">記事プレビュー</h1>
        <div className="flex gap-2">
          <Link href={`/admin/videos/${id}/ai`} className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50">
            AI結果に戻る
          </Link>
        </div>
      </div>

      {!aiContent?.article ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-gray-400 text-[15px]">記事がまだ生成されていません</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* Editor */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-[14px] font-bold text-gray-500 mb-3">Markdown</h2>
            <pre className="text-[13px] text-gray-700 leading-[1.7] whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
              {aiContent.article}
            </pre>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-[14px] font-bold text-gray-500 mb-3">プレビュー</h2>
            <div className="prose prose-sm max-w-none text-gray-700 max-h-[600px] overflow-y-auto">
              {aiContent.article.split("\n").map((line: string, i: number) => {
                if (line.startsWith("## ")) return <h2 key={i} className="text-[18px] font-bold text-gray-900 mt-4 mb-2">{line.slice(3)}</h2>
                if (line.startsWith("### ")) return <h3 key={i} className="text-[16px] font-bold text-gray-900 mt-3 mb-1">{line.slice(4)}</h3>
                if (line.startsWith("- ")) return <li key={i} className="text-[14px] ml-4 mb-1">{line.slice(2)}</li>
                if (line.trim() === "") return <br key={i} />
                return <p key={i} className="text-[14px] leading-[1.8] mb-2">{line}</p>
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
