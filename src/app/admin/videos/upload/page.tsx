"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { importYouTube } from "@/lib/admin-api"

const categories = [
  { code: "", label: "カテゴリを選択" },
  { code: "business", label: "ビジネス" },
  { code: "money", label: "マネー" },
  { code: "career", label: "キャリア" },
  { code: "life", label: "ライフ" },
  { code: "technology", label: "テクノロジー" },
  { code: "global", label: "グローバル" },
] as const

type Tab = "upload" | "youtube"

export default function UploadPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("upload")

  return (
    <div className="max-w-[640px]">
      <h1 className="text-[24px] font-bold text-gray-900 mb-6">動画を追加</h1>

      {/* Tab */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("upload")}
          className={`px-6 py-3 text-[14px] font-semibold transition-colors cursor-pointer ${
            activeTab === "upload" ? "text-[#cd1cfa] border-b-2 border-[#cd1cfa] -mb-[1px]" : "text-gray-400"
          }`}
        >
          📁 ファイルアップロード
        </button>
        <button
          onClick={() => setActiveTab("youtube")}
          className={`px-6 py-3 text-[14px] font-semibold transition-colors cursor-pointer ${
            activeTab === "youtube" ? "text-[#cd1cfa] border-b-2 border-[#cd1cfa] -mb-[1px]" : "text-gray-400"
          }`}
        >
          📺 YouTube URL
        </button>
      </div>

      {activeTab === "upload" ? <LocalUploadForm /> : <YouTubeImportForm />}
    </div>
  )
}

function LocalUploadForm() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [categoryCode, setCategoryCode] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")
  const [autoProcess, setAutoProcess] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !title) { setError("タイトルと動画ファイルは必須です"); return }
    setError(""); setUploading(true); setProgress(10)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", title)
      formData.append("description", description)
      formData.append("categoryCode", categoryCode)
      if (aiPrompt) formData.append("aiPrompt", aiPrompt)
      setProgress(30)
      const res = await fetch("/api/videos", { method: "POST", body: formData })
      setProgress(80)
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "アップロード失敗") }
      const data = await res.json()
      setProgress(100)

      if (autoProcess) {
        setStatusText("文字起こし・AI生成を開始中...")
        // バックグラウンドで自動処理を開始（レスポンスを待たずに遷移）
        fetch(`/api/videos/${data.id}/auto-process`, { method: "POST" }).catch(() => {})
      }

      router.push(`/admin/videos/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラー"); setUploading(false); setProgress(0)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="mb-5">
        <label htmlFor="local-title" className="block text-[13px] font-semibold text-gray-700 mb-1">タイトル *</label>
        <input id="local-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="動画のタイトル" className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[15px] text-gray-900 outline-none focus:border-[#cd1cfa]" />
      </div>
      <div className="mb-5">
        <label htmlFor="local-description" className="block text-[13px] font-semibold text-gray-700 mb-1">説明</label>
        <textarea id="local-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="動画の説明" rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[15px] text-gray-900 outline-none focus:border-[#cd1cfa] resize-none" />
      </div>
      <div className="mb-5">
        <label htmlFor="local-category" className="block text-[13px] font-semibold text-gray-700 mb-1">カテゴリ</label>
        <select id="local-category" value={categoryCode} onChange={(e) => setCategoryCode(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[15px] text-gray-900 outline-none focus:border-[#cd1cfa]">
          {categories.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
        </select>
      </div>
      <div className="mb-6">
        <label htmlFor="local-file" className="block text-[13px] font-semibold text-gray-700 mb-1">動画ファイル *</label>
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-[#cd1cfa] transition-colors relative">
          {file ? (
            <div>
              <p className="text-[14px] font-semibold text-gray-900">{file.name}</p>
              <p className="text-[12px] text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              <button type="button" onClick={() => setFile(null)} className="text-[12px] text-red-500 mt-1">変更</button>
            </div>
          ) : (
            <div>
              <p className="text-[13px] text-gray-500 mb-1">ファイルを選択</p>
              <p className="text-[11px] text-gray-400">.mp4, .mov, .webm（最大500MB）</p>
            </div>
          )}
          <input id="local-file" type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>
      </div>
      <div className="mb-6">
        <label htmlFor="local-ai-prompt" className="block text-[13px] font-semibold text-gray-700 mb-1">AIへの指示（任意）</label>
        <textarea
          id="local-ai-prompt"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="例: 初心者向けにわかりやすい記事にして、箇条書き多めで、要約は100文字程度で"
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#cd1cfa] resize-none"
        />
        <p className="text-[11px] text-gray-400 mt-1">文字起こし後のAI生成（要約・チャプター・記事・タグ）に適用されます。後から変更も可能です。</p>
      </div>
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={autoProcess}
            onChange={(e) => setAutoProcess(e.target.checked)}
            className="w-4 h-4 accent-[#cd1cfa]"
          />
          <div>
            <span className="text-[14px] font-semibold text-gray-700">自動AI処理</span>
            <p className="text-[11px] text-gray-400">アップロード後、文字起こし→AI生成（要約・チャプター・記事・タグ）を自動で実行します</p>
          </div>
        </label>
      </div>
      {error && <p className="text-red-500 text-[13px] mb-4">{error}</p>}
      {uploading && (
        <div className="mb-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#cd1cfa] to-[#1e82be] transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          {statusText && <p className="text-[12px] text-gray-500 mt-1">{statusText}</p>}
        </div>
      )}
      <button type="submit" disabled={uploading} className="w-full py-3 bg-[#cd1cfa] text-white rounded-lg text-[15px] font-semibold hover:bg-[#b018d8] disabled:opacity-50">
        {uploading ? "アップロード中..." : "アップロード"}
      </button>
    </form>
  )
}

function YouTubeImportForm() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")
  const [autoProcess, setAutoProcess] = useState(true)
  const [showOptions, setShowOptions] = useState(false)
  const [categoryCode, setCategoryCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState<{ title: string; authorName: string; videoId: string } | null>(null)

  // Extract videoId for preview
  function handleUrlChange(value: string) {
    setUrl(value)
    setPreview(null)
    const match = value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/)
    if (match) {
      setPreview({ title: "", authorName: "", videoId: match[1] })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url) { setError("YouTube URLを入力してください"); return }
    setError(""); setLoading(true)

    try {
      const data = await importYouTube(url, categoryCode || undefined, aiPrompt || undefined)

      if (autoProcess) {
        fetch(`/api/videos/${data.id}/auto-process`, { method: "POST" }).catch(() => {})
      }

      router.push(`/admin/videos/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラー"); setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="mb-5">
        <label htmlFor="yt-url" className="block text-[13px] font-semibold text-gray-700 mb-1">YouTube URL *</label>
        <input id="yt-url" type="text" value={url} onChange={(e) => handleUrlChange(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[15px] text-gray-900 outline-none focus:border-[#cd1cfa]" />
      </div>

      {/* Preview */}
      {preview?.videoId && (
        <div className="mb-5 rounded-lg overflow-hidden border border-gray-200">
          <iframe
            src={`https://www.youtube.com/embed/${preview.videoId}`}
            className="w-full aspect-video"
            allowFullScreen
          />
        </div>
      )}

      <div className="mb-5">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={autoProcess}
            onChange={(e) => setAutoProcess(e.target.checked)}
            className="w-4 h-4 accent-[#cd1cfa]"
          />
          <div>
            <span className="text-[14px] font-semibold text-gray-700">自動AI処理</span>
            <p className="text-[11px] text-gray-400">登録後、文字起こし→要約・記事・タグ→サムネイル生成を自動で実行</p>
          </div>
        </label>
      </div>

      {/* Optional settings toggle */}
      <button
        type="button"
        onClick={() => setShowOptions(!showOptions)}
        className="text-[12px] text-gray-400 hover:text-[#cd1cfa] mb-4 cursor-pointer"
      >
        {showOptions ? "▲ オプションを閉じる" : "▼ オプション（カテゴリ・AIへの指示）"}
      </button>

      {showOptions && (
        <div className="space-y-4 mb-5 pl-3 border-l-2 border-gray-100">
          <div>
            <label htmlFor="yt-category" className="block text-[12px] text-gray-500 mb-1">カテゴリ（任意）</label>
            <select id="yt-category" value={categoryCode} onChange={(e) => setCategoryCode(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#cd1cfa]">
              {categories.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">未選択でもOK。汎用プロンプトが自動適用されます。</p>
          </div>
          <div>
            <label htmlFor="yt-ai-prompt" className="block text-[12px] text-gray-500 mb-1">AIへの指示（任意）</label>
            <textarea
              id="yt-ai-prompt"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="特別な指示がある場合のみ入力（例: 初心者向けに、箇条書き多めで）"
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa] resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">未入力の場合、汎用プロンプトで自動生成されます。</p>
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-[13px] mb-4">{error}</p>}

      <button type="submit" disabled={loading} className="w-full py-3 bg-[#cd1cfa] text-white rounded-lg text-[15px] font-semibold hover:bg-[#b018d8] disabled:opacity-50">
        {loading ? "取得中..." : "YouTubeから登録"}
      </button>
    </form>
  )
}
