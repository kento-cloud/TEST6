"use client"

import { useState } from "react"

interface VideoWithArticle {
  id: string
  title: string
  thumbnailPath: string | null
  shortVideoPath: string | null
  articlePreview: string
}

interface Props {
  videosWithArticles: VideoWithArticle[]
}

export function ShortVideoFromArticle({ videosWithArticles }: Props) {
  const [activeTab, setActiveTab] = useState<"existing" | "new">("existing")
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set())
  const [results, setResults] = useState<Record<string, { videoPath: string } | { error: string }>>({})

  // Tab 2 state
  const [newTitle, setNewTitle] = useState("")
  const [newArticle, setNewArticle] = useState("")
  const [newGenerating, setNewGenerating] = useState(false)
  const [newResult, setNewResult] = useState<{ videoPath: string; videoId: string } | { error: string } | null>(null)

  async function handleGenerate(videoId: string) {
    setGeneratingIds((prev) => new Set([...prev, videoId]))
    setResults((prev) => {
      const next = { ...prev }
      delete next[videoId]
      return next
    })

    try {
      const res = await fetch(`/api/videos/${videoId}/generate-short`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setResults((prev) => ({ ...prev, [videoId]: { error: data.error ?? "生成に失敗しました" } }))
      } else {
        setResults((prev) => ({ ...prev, [videoId]: { videoPath: data.videoPath } }))
      }
    } catch {
      setResults((prev) => ({ ...prev, [videoId]: { error: "ネットワークエラー" } }))
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev)
        next.delete(videoId)
        return next
      })
    }
  }

  async function handleNewGenerate() {
    if (!newTitle.trim() || !newArticle.trim()) return
    setNewGenerating(true)
    setNewResult(null)

    try {
      const res = await fetch("/api/shorts/from-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), article: newArticle.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setNewResult({ error: data.error ?? "生成に失敗しました" })
      } else {
        setNewResult({ videoPath: data.shortVideoPath, videoId: data.videoId })
      }
    } catch {
      setNewResult({ error: "ネットワークエラー" })
    } finally {
      setNewGenerating(false)
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("existing")}
          className={`px-4 py-2 text-[14px] font-medium border-b-2 transition-colors ${
            activeTab === "existing"
              ? "border-[#16a34a] text-[#16a34a]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          既存動画から生成
        </button>
        <button
          onClick={() => setActiveTab("new")}
          className={`px-4 py-2 text-[14px] font-medium border-b-2 transition-colors ${
            activeTab === "new"
              ? "border-[#16a34a] text-[#16a34a]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          新規記事から生成
        </button>
      </div>

      {/* Tab 1: Existing videos */}
      {activeTab === "existing" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {videosWithArticles.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="text-gray-400 text-[15px]">記事が生成済みの動画がありません</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {videosWithArticles.map((video) => {
                const isGenerating = generatingIds.has(video.id)
                const result = results[video.id]
                const hasShort = video.shortVideoPath || (result && "videoPath" in result)

                return (
                  <div key={video.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                    {/* Thumbnail */}
                    <div className="w-[60px] h-[40px] bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {video.thumbnailPath ? (
                        <img
                          src={video.thumbnailPath}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="#d1d5db">
                            <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-gray-900 truncate">{video.title}</p>
                      <p className="text-[12px] text-gray-500 truncate mt-0.5">{video.articlePreview}...</p>
                    </div>

                    {/* Status & Action */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasShort && (
                        <span className="text-[11px] px-2 py-0.5 bg-green-50 text-[#16a34a] rounded-full font-medium">
                          生成済み
                        </span>
                      )}
                      {isGenerating ? (
                        <span className="flex items-center gap-1 text-[13px] text-gray-500">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          生成中...
                        </span>
                      ) : (
                        <button
                          onClick={() => handleGenerate(video.id)}
                          className="px-3 py-1.5 bg-[#16a34a] text-white rounded-lg text-[12px] font-medium hover:bg-[#15803d] transition-colors"
                        >
                          {hasShort ? "再生成" : "生成"}
                        </button>
                      )}
                    </div>

                    {/* Result */}
                    {result && "error" in result && (
                      <p className="text-[12px] text-red-500 ml-2">{result.error}</p>
                    )}
                    {result && "videoPath" in result && (
                      <a
                        href={result.videoPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] text-blue-500 hover:text-blue-700 ml-2"
                      >
                        プレビュー
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: New article */}
      {activeTab === "new" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <p className="text-[13px] text-gray-500 mb-4">
            記事テキストから直接ショート動画を生成します。動画ファイルは不要です。
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1">タイトル</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="ショート動画のタイトル"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1">記事テキスト</label>
              <textarea
                value={newArticle}
                onChange={(e) => setNewArticle(e.target.value)}
                rows={10}
                placeholder="ショート動画の元となる記事テキストを入力してください..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] resize-y"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleNewGenerate}
                disabled={newGenerating || !newTitle.trim() || !newArticle.trim()}
                className="px-4 py-2 bg-[#16a34a] text-white rounded-lg text-[14px] font-semibold hover:bg-[#15803d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {newGenerating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    生成中...
                  </span>
                ) : (
                  "ショート動画を生成"
                )}
              </button>
            </div>

            {newResult && "error" in newResult && (
              <p className="text-[13px] text-red-500">{newResult.error}</p>
            )}
            {newResult && "videoPath" in newResult && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-[13px] text-[#16a34a] font-medium mb-2">生成完了</p>
                <a
                  href={newResult.videoPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-blue-500 hover:text-blue-700"
                >
                  動画をプレビュー
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
