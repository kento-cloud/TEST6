"use client"

import { useState, useEffect } from "react"

interface ThumbnailPreset {
  id: string
  name: string
  prompt_template: string
  style_params: string | null
  is_default: number
}

export function ThumbnailPresetManager() {
  const [presets, setPresets] = useState<ThumbnailPreset[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: "", promptTemplate: "" })
  const [showNewForm, setShowNewForm] = useState(false)
  const [newForm, setNewForm] = useState({ name: "", promptTemplate: "" })

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
    if (!newForm.name || !newForm.promptTemplate) { setMessage("名前とプロンプトは必須です"); return }
    try {
      const res = await fetch("/api/thumbnail-presets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newForm) })
      if (!res.ok) throw new Error("追加に失敗しました")
      setNewForm({ name: "", promptTemplate: "" }); setShowNewForm(false); setMessage("追加しました"); fetchPresets()
    } catch (e) { setMessage(e instanceof Error ? e.message : "追加に失敗しました") }
  }

  async function handleUpdate(id: string) {
    try {
      const res = await fetch(`/api/thumbnail-presets/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) })
      if (!res.ok) throw new Error("更新に失敗しました")
      setEditingId(null); setMessage("更新しました"); fetchPresets()
    } catch (e) { setMessage(e instanceof Error ? e.message : "更新に失敗しました") }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？`)) return
    try {
      const res = await fetch(`/api/thumbnail-presets/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("削除に失敗しました")
      setMessage("削除しました"); fetchPresets()
    } catch (e) { setMessage(e instanceof Error ? e.message : "削除に失敗しました") }
  }

  return (
    <div>
      {message && (
        <p className={`text-[13px] mb-3 ${message.includes("失敗") ? "text-red-500" : "text-green-600"}`}>{message}</p>
      )}

      {loading ? (
        <p className="text-[13px] text-gray-400">読み込み中...</p>
      ) : (
        <div className="space-y-3">
          {presets.map((preset) => (
            <div key={preset.id} className="border border-gray-100 rounded-lg p-4">
              {editingId === preset.id ? (
                <div className="space-y-2">
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="テンプレート名" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#16a34a]" />
                  <textarea value={editForm.promptTemplate} onChange={(e) => setEditForm({ ...editForm, promptTemplate: e.target.value })} placeholder="プロンプトテンプレート" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#16a34a] resize-none" rows={3} />
                  <p className="text-[10px] text-gray-400">{"{{title}}"} でタイトルが自動挿入されます</p>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-[12px] text-gray-500 hover:bg-gray-50 rounded-lg cursor-pointer">キャンセル</button>
                    <button onClick={() => handleUpdate(preset.id)} className="px-4 py-1.5 bg-[#16a34a] text-white rounded-lg text-[12px] font-semibold hover:bg-[#15803d] cursor-pointer">保存</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold text-gray-900">{preset.name}</p>
                        {preset.is_default === 1 && (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-600 rounded text-[10px] font-semibold">デフォルト</span>
                        )}
                      </div>
                      <p className="text-[12px] text-gray-500 mt-1.5 bg-gray-50 rounded px-2 py-1.5 leading-relaxed line-clamp-2">{preset.prompt_template}</p>
                    </div>
                    <div className="flex gap-1 ml-3 shrink-0">
                      <button onClick={() => { setEditingId(preset.id); setEditForm({ name: preset.name, promptTemplate: preset.prompt_template }) }} className="px-2 py-1 text-[11px] text-blue-600 hover:bg-blue-50 rounded cursor-pointer">編集</button>
                      <button onClick={() => handleDelete(preset.id, preset.name)} className="px-2 py-1 text-[11px] text-red-500 hover:bg-red-50 rounded cursor-pointer">削除</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {presets.length === 0 && <p className="text-[13px] text-gray-400">テンプレートがありません</p>}
        </div>
      )}

      <div className="mt-4">
        {showNewForm ? (
          <div className="border border-dashed border-green-200 rounded-lg p-4 space-y-2">
            <input type="text" value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} placeholder="テンプレート名" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#16a34a]" />
            <textarea value={newForm.promptTemplate} onChange={(e) => setNewForm({ ...newForm, promptTemplate: e.target.value })} placeholder="プロンプトテンプレート（{{title}} でタイトル自動挿入）" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#16a34a] resize-none" rows={3} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowNewForm(false); setNewForm({ name: "", promptTemplate: "" }) }} className="px-3 py-1.5 text-[12px] text-gray-500 hover:bg-gray-50 rounded-lg cursor-pointer">キャンセル</button>
              <button onClick={handleCreate} className="px-4 py-1.5 bg-[#16a34a] text-white rounded-lg text-[12px] font-semibold hover:bg-[#15803d] cursor-pointer">追加</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowNewForm(true)} className="w-full py-2.5 border border-dashed border-gray-300 rounded-lg text-[13px] text-gray-500 hover:bg-gray-50 hover:border-[#16a34a] hover:text-[#16a34a] transition-colors cursor-pointer">
            + 新規テンプレートを追加
          </button>
        )}
      </div>
    </div>
  )
}
