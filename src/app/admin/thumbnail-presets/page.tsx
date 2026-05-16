"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface ThumbnailPreset {
  id: string
  name: string
  prompt_template: string
  style_params: string | null
  is_default: number
  created_at: string
}

export default function ThumbnailPresetsPage() {
  const [presets, setPresets] = useState<ThumbnailPreset[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: "", promptTemplate: "", styleParams: "" })
  const [showNewForm, setShowNewForm] = useState(false)
  const [newForm, setNewForm] = useState({ name: "", promptTemplate: "", styleParams: "" })

  useEffect(() => { fetchPresets() }, [])

  async function fetchPresets() {
    setLoading(true)
    try {
      const res = await fetch("/api/thumbnail-presets")
      const data = await res.json()
      if (Array.isArray(data)) setPresets(data)
    } catch {
      setMessage("取得に失敗しました")
    }
    setLoading(false)
  }

  async function handleCreate() {
    if (!newForm.name || !newForm.promptTemplate) {
      setMessage("名前とプロンプトテンプレートは必須です")
      return
    }
    try {
      const res = await fetch("/api/thumbnail-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      })
      if (!res.ok) throw new Error("追加に失敗しました")
      setNewForm({ name: "", promptTemplate: "", styleParams: "" })
      setShowNewForm(false)
      setMessage("テンプレートを追加しました")
      fetchPresets()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "追加に失敗しました")
    }
  }

  async function handleUpdate(id: string) {
    try {
      const res = await fetch(`/api/thumbnail-presets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error("更新に失敗しました")
      setEditingId(null)
      setMessage("テンプレートを更新しました")
      fetchPresets()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "更���に失敗しました")
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`「${name}」を削除しますか���`)) return
    try {
      const res = await fetch(`/api/thumbnail-presets/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("削除に失敗しました")
      setMessage("テンプレートを削除しました")
      fetchPresets()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "削除に失敗しました")
    }
  }

  async function handleSetDefault(id: string) {
    try {
      const res = await fetch(`/api/thumbnail-presets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      })
      if (!res.ok) throw new Error("設定に失敗しました")
      setMessage("デフォルトに設���しました")
      fetchPresets()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "設定に失敗しました")
    }
  }

  function startEdit(preset: ThumbnailPreset) {
    setEditingId(preset.id)
    setEditForm({
      name: preset.name,
      promptTemplate: preset.prompt_template,
      styleParams: preset.style_params ?? "",
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-gray-900">サムネイルテンプレート</h1>
          <p className="text-[13px] text-gray-400 mt-1">サムネイル生成時に選べるデザインテンプレートを管理します。テンプレートを選ぶとプロンプトが自動適用されます。</p>
        </div>
        <Link href="/admin/settings" className="text-[13px] text-gray-400 hover:text-gray-600">← 設定に戻る</Link>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-2 rounded-lg text-[13px] ${message.includes("失敗") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-[13px] text-gray-400">読み込み中...</p>
      ) : (
        <div className="space-y-4">
          {presets.map((preset) => (
            <div key={preset.id} className="bg-white rounded-xl border border-gray-100 p-5">
              {editingId === preset.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[12px] text-gray-400 mb-1">テンプレート名</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-400 mb-1">プロンプトテンプレート</label>
                    <textarea
                      value={editForm.promptTemplate}
                      onChange={(e) => setEditForm({ ...editForm, promptTemplate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa] resize-none"
                      rows={4}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">{"{{title}}"} でタイトルが自動挿入されます</p>
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-400 mb-1">スタイルパラメータ（JSON、任意）</label>
                    <textarea
                      value={editForm.styleParams}
                      onChange={(e) => setEditForm({ ...editForm, styleParams: e.target.value })}
                      placeholder='{"colorScheme": "blue", "layout": "centered"}'
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa] resize-none font-mono"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-[12px] text-gray-500 hover:bg-gray-50 rounded-lg cursor-pointer">キャンセル</button>
                    <button onClick={() => handleUpdate(preset.id)} className="px-4 py-1.5 bg-[#cd1cfa] text-white rounded-lg text-[12px] font-semibold hover:bg-[#b018d8] cursor-pointer">保存</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[15px] font-semibold text-gray-900">{preset.name}</h3>
                      {preset.is_default === 1 && (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded text-[10px] font-semibold">デフォルト</span>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2 mt-2">
                      <p className="text-[12px] text-gray-600 leading-relaxed whitespace-pre-wrap">{preset.prompt_template}</p>
                    </div>
                    {preset.style_params && (
                      <p className="text-[11px] text-gray-400 mt-1 font-mono">params: {preset.style_params}</p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-4 shrink-0">
                    {preset.is_default !== 1 && (
                      <button onClick={() => handleSetDefault(preset.id)} className="px-2 py-1 text-[11px] text-purple-600 hover:bg-purple-50 rounded cursor-pointer">デフォルトに</button>
                    )}
                    <button onClick={() => startEdit(preset)} className="px-2 py-1 text-[11px] text-blue-600 hover:bg-blue-50 rounded cursor-pointer">編集</button>
                    <button onClick={() => handleDelete(preset.id, preset.name)} className="px-2 py-1 text-[11px] text-red-500 hover:bg-red-50 rounded cursor-pointer">削除</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {presets.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <p className="text-[14px] text-gray-400 mb-2">テンプレートがまだありません</p>
              <p className="text-[12px] text-gray-300">下の「新規追加」から作成してください</p>
            </div>
          )}
        </div>
      )}

      {/* New template form */}
      <div className="mt-6">
        {showNewForm ? (
          <div className="bg-white rounded-xl border border-dashed border-purple-200 p-5 space-y-3">
            <h3 className="text-[14px] font-semibold text-gray-900">新規テンプレート追加</h3>
            <div>
              <label className="block text-[12px] text-gray-400 mb-1">テンプレート名</label>
              <input
                type="text"
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                placeholder="例: テンプレートA（ビジネス・シンプル）"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa]"
              />
            </div>
            <div>
              <label className="block text-[12px] text-gray-400 mb-1">プロンプトテンプレート</label>
              <textarea
                value={newForm.promptTemplate}
                onChange={(e) => setNewForm({ ...newForm, promptTemplate: e.target.value })}
                placeholder="例: シンプルで洗練されたビジネス風のサムネイル。タイトル: {{title}}。白背景にブルーのアクセントカラー。テキストなし。"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa] resize-none"
                rows={4}
              />
              <p className="text-[10px] text-gray-400 mt-1">{"{{title}}"} でタイトルが自動挿入されます。カラー・構図・雰囲気を具体的に記述してください。</p>
            </div>
            <div>
              <label className="block text-[12px] text-gray-400 mb-1">スタイルパラメータ（JSON、任意）</label>
              <textarea
                value={newForm.styleParams}
                onChange={(e) => setNewForm({ ...newForm, styleParams: e.target.value })}
                placeholder='{"colorScheme": "blue-white", "layout": "centered", "mood": "professional"}'
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#cd1cfa] resize-none font-mono"
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowNewForm(false); setNewForm({ name: "", promptTemplate: "", styleParams: "" }) }} className="px-3 py-1.5 text-[12px] text-gray-500 hover:bg-gray-50 rounded-lg cursor-pointer">キャンセ��</button>
              <button onClick={handleCreate} className="px-4 py-1.5 bg-[#cd1cfa] text-white rounded-lg text-[12px] font-semibold hover:bg-[#b018d8] cursor-pointer">追��する</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNewForm(true)}
            className="w-full py-3 border border-dashed border-gray-300 rounded-xl text-[13px] text-gray-500 hover:bg-gray-50 hover:border-[#cd1cfa] hover:text-[#cd1cfa] transition-colors cursor-pointer"
          >
            + 新規テンプレートを追加
          </button>
        )}
      </div>
    </div>
  )
}
