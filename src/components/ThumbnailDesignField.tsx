"use client"

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { LAYOUT_RENDERERS, hasLayout, THUMB_W, THUMB_H } from "@/components/thumbnail-layouts"
import { nodeToThumbnailBlob, uploadComposedThumbnail } from "@/lib/compose-thumbnail"

interface TemplateSlot {
  readonly key: string
  readonly label: string
  readonly type: "text" | "textarea" | "color" | "select"
  readonly default?: string
  readonly options?: ReadonlyArray<{ value: string; label: string }>
}
interface TemplateMeta {
  readonly id: string
  readonly name: string
  readonly tagline: string
  readonly palette: ReadonlyArray<string>
  readonly sample: string
  readonly slots: ReadonlyArray<TemplateSlot>
}

export interface ThumbnailDesignHandle {
  /** サムネ自動生成が有効でテンプレが選択されているか */
  isEnabled: () => boolean
  /** 作成済み動画にサムネを合成・アップロードして主サムネに設定 */
  uploadFor: (videoId: string) => Promise<void>
}

interface Props {
  /** 見出しの元になるタイトル（ユーザーが見出しを手編集するまで自動同期） */
  readonly title: string
}

const PREVIEW_W = 440

export const ThumbnailDesignField = forwardRef<ThumbnailDesignHandle, Props>(function ThumbnailDesignField(
  { title },
  ref
) {
  const [enabled, setEnabled] = useState(true)
  const [templates, setTemplates] = useState<TemplateMeta[]>([])
  const [selectedId, setSelectedId] = useState<string>("")
  const [slots, setSlots] = useState<Record<string, string>>({})
  const headlineTouched = useRef(false)
  const captureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/thumbnail-templates")
      .then((r) => r.json())
      .then((data: TemplateMeta[]) => {
        if (!Array.isArray(data)) return
        const usable = data.filter((t) => hasLayout(t.id))
        setTemplates(usable)
        if (usable[0]) applyTemplate(usable[0])
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function applyTemplate(t: TemplateMeta) {
    setSelectedId(t.id)
    const init: Record<string, string> = {}
    for (const s of t.slots) init[s.key] = s.default ?? ""
    init.headline = headlineTouched.current ? (slots.headline ?? title) : title
    setSlots(init)
  }

  // タイトル変更を見出しに自動同期（手編集前のみ）
  useEffect(() => {
    if (!headlineTouched.current) setSlots((prev) => ({ ...prev, headline: title }))
  }, [title])

  function updateSlot(key: string, value: string) {
    if (key === "headline") headlineTouched.current = true
    setSlots((prev) => ({ ...prev, [key]: value }))
  }

  useImperativeHandle(ref, () => ({
    isEnabled: () => enabled && !!selectedId,
    uploadFor: async (videoId: string) => {
      if (!enabled || !selectedId || !captureRef.current) return
      const blob = await nodeToThumbnailBlob(captureRef.current)
      await uploadComposedThumbnail(videoId, blob, `composed_${selectedId}`)
    },
  }), [enabled, selectedId])

  const selected = templates.find((t) => t.id === selectedId)
  const Renderer = selectedId ? LAYOUT_RENDERERS[selectedId] : null
  const scale = PREVIEW_W / THUMB_W

  // 編集可能なスロット（見出し＋配色＋テンプレ固有の文字スロット少数）
  const editableSlots = (selected?.slots ?? []).filter(
    (s) => s.key === "headline" || s.type === "color" || ["brand", "genre", "badge", "subbrand1", "subbrand2", "number", "unit"].includes(s.key)
  )

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <label className="flex items-center gap-3 cursor-pointer mb-3">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-4 h-4 accent-[#16a34a]" />
        <div>
          <span className="text-[14px] font-semibold text-gray-700">タイトルからサムネイルを自動生成</span>
          <p className="text-[11px] text-gray-400">デザインを選ぶと、タイトルが見出しに反映されます。後から編集も可能です。</p>
        </div>
      </label>

      {enabled && (
        <>
          {/* テンプレ選択（横スクロールの見本カード） */}
          {templates.length === 0 ? (
            <p className="text-[12px] text-gray-400">テンプレートを読み込み中...</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
              {templates.map((t) => {
                const active = selectedId === t.id
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => applyTemplate(t)}
                    className={`shrink-0 w-[132px] rounded-lg border-2 overflow-hidden transition-all cursor-pointer ${active ? "border-[#16a34a] ring-2 ring-[#16a34a]/25" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="relative aspect-video bg-gray-100">
                      <img src={t.sample} alt={t.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                      {active && <span className="absolute top-1 right-1 w-4 h-4 bg-[#16a34a] rounded-full flex items-center justify-center"><svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></span>}
                    </div>
                    <p className="text-[10px] font-bold text-gray-800 px-1.5 py-1 leading-tight text-left">{t.id}. {t.name}</p>
                  </button>
                )
              })}
            </div>
          )}

          {selected && Renderer && (
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 編集フォーム（最小限） */}
              <div className="flex-1 min-w-0 space-y-2.5">
                {editableSlots.map((s) => (
                  <div key={s.key}>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">{s.label}</label>
                    {s.type === "color" ? (
                      <div className="flex items-center gap-2">
                        <input type="color" value={slots[s.key] || "#16a34a"} onChange={(e) => updateSlot(s.key, e.target.value)} className="w-9 h-8 rounded border border-gray-200 cursor-pointer" />
                        <input type="text" value={slots[s.key] ?? ""} onChange={(e) => updateSlot(s.key, e.target.value)} className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-900 outline-none focus:border-[#16a34a]" />
                      </div>
                    ) : s.key === "headline" ? (
                      <textarea value={slots[s.key] ?? ""} onChange={(e) => updateSlot(s.key, e.target.value)} rows={2} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-900 outline-none focus:border-[#16a34a] resize-none" />
                    ) : (
                      <input type="text" value={slots[s.key] ?? ""} onChange={(e) => updateSlot(s.key, e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-900 outline-none focus:border-[#16a34a]" />
                    )}
                  </div>
                ))}
              </div>

              {/* ライブプレビュー */}
              <div className="shrink-0 max-w-full overflow-x-auto">
                <div className="rounded-lg overflow-hidden border border-gray-200" style={{ width: PREVIEW_W, height: PREVIEW_W * THUMB_H / THUMB_W }}>
                  <div style={{ width: THUMB_W, height: THUMB_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                    <div ref={captureRef}>
                      <Renderer slots={slots} />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 text-center" style={{ width: PREVIEW_W }}>この見た目で保存されます</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
})
