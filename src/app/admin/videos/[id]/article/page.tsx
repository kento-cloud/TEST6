import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { ArticleEditor } from "@/components/ArticleEditor"

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
        <Link href={`/admin/videos/${id}`} className="text-[13px] text-gray-400 hover:text-gray-600">← 動画詳細</Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-bold text-gray-900">記事編集</h1>
        <Link href={`/admin/videos/${id}/ai`} className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50">
          AI結果に戻る
        </Link>
      </div>

      {!aiContent?.article ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-gray-400 text-[15px]">記事がまだ生成されていません</p>
        </div>
      ) : (
        <ArticleEditor videoId={id} initialArticle={aiContent.article} />
      )}
    </div>
  )
}
