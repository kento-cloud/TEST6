"use client"

import { useState, useEffect } from "react"

interface StylePreset {
  id: string
  name: string
  description: string
  prompt_template: string
  is_default: number
  sort_order: number
}

interface KeyStatus {
  set: boolean
  masked: string
}

interface SettingsData {
  OPENAI_API_KEY?: KeyStatus
  ADMIN_PASSWORD?: KeyStatus
  AI_TEXT_MODEL?: string
  AI_IMAGE_MODEL?: string
  AI_TRANSCRIBE_MODEL?: string
  AI_SUMMARY_BASE_PROMPT?: string
  AI_CHAPTERS_BASE_PROMPT?: string
  AI_ARTICLE_BASE_PROMPT?: string
  AI_TAGS_BASE_PROMPT?: string
}

const TEXT_MODELS = [
  { id: "gpt-5.5", label: "GPT-5.5（最新・最強）" },
  { id: "gpt-5.5-pro", label: "GPT-5.5 Pro（精度重視）" },
  { id: "gpt-5.4", label: "GPT-5.4（バランス）" },
  { id: "gpt-5.4-mini", label: "GPT-5.4 Mini（軽量）" },
  { id: "gpt-5.4-nano", label: "GPT-5.4 Nano（最安）" },
  { id: "gpt-4.1", label: "GPT-4.1（コスパ推奨）" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini（高速）" },
  { id: "gpt-4.1-nano", label: "GPT-4.1 Nano（最速）" },
]

const IMAGE_MODELS = [
  { id: "gpt-image-2", label: "GPT Image 2（最新・高品質）" },
  { id: "gpt-image-1-mini", label: "GPT Image 1 Mini（軽量）" },
]

const TRANSCRIBE_MODELS = [
  { id: "gpt-4o-transcribe", label: "GPT-4o Transcribe（高品質）" },
  { id: "gpt-4o-mini-transcribe", label: "GPT-4o Mini Transcribe（軽量）" },
  { id: "whisper-1", label: "Whisper-1（従来版）" },
]

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({})
  const [openaiKey, setOpenaiKey] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [textModel, setTextModel] = useState("gpt-4.1")
  const [imageModel, setImageModel] = useState("gpt-image-2")
  const [transcribeModel, setTranscribeModel] = useState("gpt-4o-transcribe")
  const [summaryBasePrompt, setSummaryBasePrompt] = useState("")
  const [chaptersBasePrompt, setChaptersBasePrompt] = useState("")
  const [articleBasePrompt, setArticleBasePrompt] = useState("")
  const [tagsBasePrompt, setTagsBasePrompt] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [ffmpegOk, setFfmpegOk] = useState<boolean | null>(null)

  // Style Presets
  const [presets, setPresets] = useState<StylePreset[]>([])
  const [presetsLoading, setPresetsLoading] = useState(true)
  const [editingPreset, setEditingPreset] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: "", description: "", promptTemplate: "" })
  const [newPreset, setNewPreset] = useState({ name: "", description: "", promptTemplate: "" })
  const [presetMessage, setPresetMessage] = useState("")
  const [showNewForm, setShowNewForm] = useState(false)

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data: SettingsData) => {
        setSettings(data)
        setTextModel(data.AI_TEXT_MODEL ?? "gpt-4.1")
        setImageModel(data.AI_IMAGE_MODEL ?? "gpt-image-2")
        setTranscribeModel(data.AI_TRANSCRIBE_MODEL ?? "gpt-4o-transcribe")
        setSummaryBasePrompt(data.AI_SUMMARY_BASE_PROMPT ?? "")
        setChaptersBasePrompt(data.AI_CHAPTERS_BASE_PROMPT ?? "")
        setArticleBasePrompt(data.AI_ARTICLE_BASE_PROMPT ?? "")
        setTagsBasePrompt(data.AI_TAGS_BASE_PROMPT ?? "")
      })
      .catch(() => {
        setMessage("設定データの取得に失敗しました")
      })

    fetch("/api/admin/settings/ffmpeg")
      .then((r) => r.json())
      .then((data) => setFfmpegOk(data.installed))
      .catch(() => setFfmpegOk(false))

    fetchPresets()
  }, [])

  function fetchPresets() {
    setPresetsLoading(true)
    fetch("/api/ai-style-presets")
      .then((r) => r.json())
      .then((data: StylePreset[]) => {
        if (Array.isArray(data)) setPresets(data)
      })
      .catch(() => {
        setPresetMessage("プリセットの取得に失敗しました")
      })
      .finally(() => setPresetsLoading(false))
  }

  function startEditPreset(preset: StylePreset) {
    setEditingPreset(preset.id)
    setEditForm({
      name: preset.name,
      description: preset.description,
      promptTemplate: preset.prompt_template,
    })
  }

  async function savePresetEdit(id: string) {
    setPresetMessage("")
    try {
      const res = await fetch(`/api/ai-style-presets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error("更新に失敗しました")
      setEditingPreset(null)
      setPresetMessage("プリセットを更新しました")
      fetchPresets()
    } catch (e) {
      setPresetMessage(e instanceof Error ? e.message : "更新に失敗しました")
    }
  }

  async function deletePreset(id: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？`)) return
    setPresetMessage("")
    try {
      const res = await fetch(`/api/ai-style-presets/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("削除に失敗しました")
      setPresetMessage("プリセットを削除しました")
      fetchPresets()
    } catch (e) {
      setPresetMessage(e instanceof Error ? e.message : "削除に失敗しました")
    }
  }

  async function addPreset() {
    if (!newPreset.name || !newPreset.promptTemplate) {
      setPresetMessage("名前とプロンプトは必須です")
      return
    }
    setPresetMessage("")
    try {
      const res = await fetch("/api/ai-style-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPreset),
      })
      if (!res.ok) throw new Error("追加に失敗しました")
      setNewPreset({ name: "", description: "", promptTemplate: "" })
      setShowNewForm(false)
      setPresetMessage("プリセットを追加しました")
      fetchPresets()
    } catch (e) {
      setPresetMessage(e instanceof Error ? e.message : "追加に失敗しました")
    }
  }

  async function handleSave() {
    setSaving(true)
    setMessage("")
    const body: Record<string, string> = {}
    if (openaiKey) body.OPENAI_API_KEY = openaiKey
    if (adminPassword) body.ADMIN_PASSWORD = adminPassword
    body.AI_TEXT_MODEL = textModel
    body.AI_IMAGE_MODEL = imageModel
    body.AI_TRANSCRIBE_MODEL = transcribeModel
    body.AI_SUMMARY_BASE_PROMPT = summaryBasePrompt
    body.AI_CHAPTERS_BASE_PROMPT = chaptersBasePrompt
    body.AI_ARTICLE_BASE_PROMPT = articleBasePrompt
    body.AI_TAGS_BASE_PROMPT = tagsBasePrompt

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setMessage(data.message ?? "保存しました")
      setOpenaiKey("")
      setAdminPassword("")
      const updated = await fetch("/api/admin/settings").then((r) => r.json())
      setSettings(updated)
    } catch {
      setMessage("保存に失敗しました")
    }
    setSaving(false)
  }

  return (
    <div>
      <h1 className="text-[24px] font-bold text-gray-900 mb-6">設定</h1>

      {/* Environment Status */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden max-w-[700px] mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-[16px] font-bold text-gray-900">環境ステータス</h2>
        </div>
        <div className="divide-y divide-gray-50">
          <StatusRow label="OPENAI_API_KEY" desc="文字起こし・AI生成・画像生成に使用" status={settings.OPENAI_API_KEY} />
          <StatusRow label="ADMIN_PASSWORD" desc="管理画面ログインパスワード" status={settings.ADMIN_PASSWORD} />
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold text-gray-900">ffmpeg</p>
              <p className="text-[12px] text-gray-400 mt-0.5">動画処理・音声抽出に使用</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-gray-500 font-mono">{ffmpegOk === null ? "確認中..." : ffmpegOk ? "インストール済み" : "未インストール"}</span>
              <span className={`w-2.5 h-2.5 rounded-full ${ffmpegOk ? "bg-green-500" : ffmpegOk === false ? "bg-red-400" : "bg-gray-300"}`} />
            </div>
          </div>
        </div>
      </div>

      {/* AI Model Selection */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden max-w-[700px] mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-[16px] font-bold text-gray-900">AIモデル設定</h2>
          <p className="text-[13px] text-gray-400 mt-0.5">使用するOpenAIモデルを選択します。全てOpenAI APIキー1つで動作します。</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1">テキスト生成モデル</label>
            <select
              value={textModel}
              onChange={(e) => setTextModel(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#cd1cfa]"
            >
              {TEXT_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.id} — {m.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">要約・チャプター・記事・タグ生成に使用</p>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1">画像生成モデル</label>
            <select
              value={imageModel}
              onChange={(e) => setImageModel(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#cd1cfa]"
            >
              {IMAGE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.id} — {m.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">サムネイル画像の生成に使用</p>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1">文字起こしモデル</label>
            <select
              value={transcribeModel}
              onChange={(e) => setTranscribeModel(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#cd1cfa]"
            >
              {TRANSCRIBE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.id} — {m.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">動画の音声→テキスト変換に使用</p>
          </div>
        </div>
      </div>

      {/* Style Presets */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden max-w-[700px] mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-[16px] font-bold text-gray-900">記事スタイルプリセット</h2>
          <p className="text-[13px] text-gray-400 mt-0.5">AI記事生成時に選べるスタイルプリセットを管理します。プリセットを選ぶとプロンプトが自動入力されます。</p>
        </div>
        <div className="p-5">
          {presetMessage && (
            <p className={`text-[13px] mb-3 ${presetMessage.includes("失敗") ? "text-red-500" : "text-green-600"}`}>{presetMessage}</p>
          )}

          {presetsLoading ? (
            <p className="text-[13px] text-gray-400">読み込み中...</p>
          ) : (
            <div className="space-y-3">
              {presets.map((preset) => (
                <div key={preset.id} className="border border-gray-100 rounded-lg p-4">
                  {editingPreset === preset.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="プリセット名"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa]"
                      />
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="説明"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa]"
                      />
                      <textarea
                        value={editForm.promptTemplate}
                        onChange={(e) => setEditForm({ ...editForm, promptTemplate: e.target.value })}
                        placeholder="プロンプトテンプレート"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa] resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingPreset(null)}
                          className="px-3 py-1.5 text-[12px] text-gray-500 hover:bg-gray-50 rounded-lg cursor-pointer"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={() => savePresetEdit(preset.id)}
                          className="px-4 py-1.5 bg-[#cd1cfa] text-white rounded-lg text-[12px] font-semibold hover:bg-[#b018d8] cursor-pointer"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-semibold text-gray-900">{preset.name}</p>
                            {preset.is_default === 1 && (
                              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded text-[10px] font-semibold">デフォルト</span>
                            )}
                          </div>
                          <p className="text-[12px] text-gray-400 mt-0.5">{preset.description}</p>
                          <p className="text-[12px] text-gray-500 mt-1.5 bg-gray-50 rounded px-2 py-1.5 leading-relaxed">{preset.prompt_template}</p>
                        </div>
                        <div className="flex gap-1 ml-3 shrink-0">
                          <button
                            onClick={() => startEditPreset(preset)}
                            className="px-2 py-1 text-[11px] text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => deletePreset(preset.id, preset.name)}
                            className="px-2 py-1 text-[11px] text-red-500 hover:bg-red-50 rounded cursor-pointer"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {presets.length === 0 && (
                <p className="text-[13px] text-gray-400">プリセットがありません</p>
              )}
            </div>
          )}

          {/* New preset form */}
          <div className="mt-4">
            {showNewForm ? (
              <div className="border border-dashed border-purple-200 rounded-lg p-4 space-y-2">
                <p className="text-[13px] font-semibold text-gray-700 mb-2">新規プリセット</p>
                <input
                  type="text"
                  value={newPreset.name}
                  onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })}
                  placeholder="プリセット名（例: 技術解説）"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa]"
                />
                <input
                  type="text"
                  value={newPreset.description}
                  onChange={(e) => setNewPreset({ ...newPreset, description: e.target.value })}
                  placeholder="説明（例: エンジニア向けの技術解説記事）"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa]"
                />
                <textarea
                  value={newPreset.promptTemplate}
                  onChange={(e) => setNewPreset({ ...newPreset, promptTemplate: e.target.value })}
                  placeholder="プロンプトテンプレート（例: 技術者向けに、コード例やアーキテクチャの解説を含めて...）"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa] resize-none"
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setShowNewForm(false); setNewPreset({ name: "", description: "", promptTemplate: "" }) }}
                    className="px-3 py-1.5 text-[12px] text-gray-500 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={addPreset}
                    className="px-4 py-1.5 bg-[#cd1cfa] text-white rounded-lg text-[12px] font-semibold hover:bg-[#b018d8] cursor-pointer"
                  >
                    追加
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewForm(true)}
                className="w-full py-2.5 border border-dashed border-gray-300 rounded-lg text-[13px] text-gray-500 hover:bg-gray-50 hover:border-[#cd1cfa] hover:text-[#cd1cfa] transition-colors cursor-pointer"
              >
                + 新規プリセットを追加
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Base Prompts */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden max-w-[700px] mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-[16px] font-bold text-gray-900">AI生成ベースプロンプト</h2>
          <p className="text-[13px] text-gray-400 mt-0.5">各項目の生成に共通で適用される指示です。動画ごとの個別指示はAI生成時に追加できます。</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1">要約</label>
            <textarea
              value={summaryBasePrompt}
              onChange={(e) => setSummaryBasePrompt(e.target.value)}
              placeholder="例: 専門用語を避け、一般のビジネスパーソンにわかる表現で"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa] resize-none"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1">チャプター</label>
            <textarea
              value={chaptersBasePrompt}
              onChange={(e) => setChaptersBasePrompt(e.target.value)}
              placeholder="例: 5分以内の細かいチャプターに分けて"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa] resize-none"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1">記事</label>
            <textarea
              value={articleBasePrompt}
              onChange={(e) => setArticleBasePrompt(e.target.value)}
              placeholder="例: ビジネスパーソン向けにわかりやすく、具体的な数字やデータを含めて"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa] resize-none"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1">タグ</label>
            <textarea
              value={tagsBasePrompt}
              onChange={(e) => setTagsBasePrompt(e.target.value)}
              placeholder="例: SEOを意識したキーワードを含めて"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa] resize-none"
              rows={2}
            />
          </div>
          <p className="text-[11px] text-gray-400">空欄の場合はデフォルトのプロンプトのみで生成されます。サムネイルは生成時に直接プロンプトを入力する仕組みです。</p>
        </div>
      </div>

      {/* API Key & Password */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden max-w-[700px]">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-[16px] font-bold text-gray-900">APIキー・パスワード</h2>
          <p className="text-[13px] text-gray-400 mt-0.5">入力して保存すると .env.local に書き込まれます。空欄のまま保存すると変更されません。</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1">OpenAI API Key</label>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder={settings.OPENAI_API_KEY?.set ? "設定済み（変更する場合のみ入力）" : "sk-..."}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#cd1cfa] font-mono"
            />
            <p className="text-[11px] text-gray-400 mt-1">Whisper（文字起こし）・テキスト生成・画像生成の全てに使用</p>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1">管理者パスワード</label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="変更する場合のみ入力"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#cd1cfa]"
            />
          </div>

          {message && (
            <p className={`text-[13px] ${message.includes("失敗") ? "text-red-500" : "text-green-600"}`}>{message}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-[#cd1cfa] text-white rounded-lg text-[15px] font-semibold hover:bg-[#b018d8] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {saving ? "保存中..." : "保存する"}
          </button>

        </div>
      </div>
    </div>
  )
}

function StatusRow({ label, desc, status }: { label: string; desc: string; status?: KeyStatus }) {
  return (
    <div className="px-5 py-4 flex items-center justify-between">
      <div>
        <p className="text-[14px] font-semibold text-gray-900">{label}</p>
        <p className="text-[12px] text-gray-400 mt-0.5">{desc}</p>
      </div>
      <div className="flex items-center gap-3 ml-4 shrink-0">
        <span className="text-[13px] text-gray-500 font-mono">{status?.set ? status.masked : "未設定"}</span>
        <span className={`w-2.5 h-2.5 rounded-full ${status?.set ? "bg-green-500" : "bg-red-400"}`} />
      </div>
    </div>
  )
}
