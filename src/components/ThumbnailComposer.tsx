"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toPng } from "html-to-image"
import { LAYOUT_RENDERERS, hasLayout, THUMB_W, THUMB_H } from "@/components/thumbnail-layouts"
import { setPrimaryThumbnail } from "@/lib/admin-api"
import { useElementWidth } from "@/hooks/useElementWidth"

interface TemplateSlot {
  readonly key: string
  readonly label: string
  readonly type: "text" | "textarea" | "color" | "select"
  readonly placeholder?: string
  readonly default?: string
  readonly options?: ReadonlyArray<{ value: string; label: string }>
  readonly optional?: boolean
}
interface TemplateMeta {
  readonly id: string
  readonly name: string
  readonly tagline: string
  readonly description: string
  readonly palette: ReadonlyArray<string>
  readonly sample: string
  readonly slots: ReadonlyArray<TemplateSlot>
}

interface Props {
  readonly videoId: string
  readonly videoTitle: string
}

const PREVIEW_MAX = 460 // プレビュー最大表示幅(px)。実際の表示幅はコンテナに追従
const EXPORT_SCALE = 1.5 // 書き出し倍率 → 1920x1080

export function ThumbnailComposer({ videoId, videoTitle }: Props) {
  const router = useRouter()
  const [templates, setTemplates] = useState<TemplateMeta[]>([])
  const [selectedId, setSelectedId] = useState<string>("")
  const [slots, setSlots] = useState<Record<string, string>>({})
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle")
  const [error, setError] = useState("")
  const captureRef = useRef<HTMLDivElement>(null)
  const [previewBoxRef, previewW] = useElementWidth<HTMLDivElement>(PREVIEW_MAX)

  useEffect(() => {
    fetch("/api/thumbnail-templates")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data.filter((t: TemplateMeta) => hasLayout(t.id)))
      })
      .catch(() => {})
  }, [])

  const selected = templates.find((t) => t.id === selectedId)

  function selectTemplate(t: TemplateMeta) {
    setSelectedId(t.id)
    const init: Record<string, string> = {}
    for (const s of t.slots) {
      // 見出しが空のテンプレは動画タイトルを初期値に
      if (s.key === "headline" && !s.default) init[s.key] = videoTitle
      else init[s.key] = s.default ?? ""
    }
    setSlots(init)
    setState("idle")
  }

  function update(key: string, value: string) {
    setSlots((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = useCallback(async () => {
    if (!captureRef.current || !selectedId) return
    setState("saving")
    setError("")
    try {
      const dataUrl = await toPng(captureRef.current, {
        width: THUMB_W,
        height: THUMB_H,
        pixelRatio: EXPORT_SCALE,
        cacheBust: true,
        style: { transform: "none", transformOrigin: "top left", margin: "0" },
      })
      const blob = await (await fetch(dataUrl)).blob()
      const fd = new FormData()
      fd.append("file", blob, `composed_${selectedId}.png`)
      const res = await fetch(`/api/videos/${videoId}/thumbnails`, { method: "POST", body: fd })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? "アップロードに失敗しました")
      }
      const { id: thumbId } = await res.json()
      await setPrimaryThumbnail(videoId, thumbId)
      setState("done")
      router.refresh()
    } catch (e) {
      setState("error")
      setError(e instanceof Error ? e.message : "保存に失敗しました")
    }
  }, [selectedId, videoId, router])

  const Renderer = selectedId ? LAYOUT_RENDERERS[selectedId] : null
  const scale = previewW / THUMB_W

  return (
    <div>
      {/* テンプレ選択（ビジュアルカード） */}
      {templates.length === 0 ? (
        <p className="text-[12px] text-gray-400 mb-3">テンプレートを読み込み中...</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 mb-3">
          {templates.map((t) => {
            const active = selectedId === t.id
            return (
              <button
                key={t.id}
                onClick={() => selectTemplate(t)}
                className={`group text-left rounded-xl border-2 overflow-hidden transition-all cursor-pointer ${active ? "border-[#16a34a] ring-2 ring-[#16a34a]/25" : "border-gray-200 hover:border-gray-300 bg-white"}`}
              >
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                  <img src={t.sample} alt={`${t.name} のデザイン例`} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/55 text-white text-[9px] font-semibold rounded backdrop-blur-sm">デザイン例</span>
                  {active && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-[#16a34a] rounded-full flex items-center justify-center shadow">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </span>
                  )}
                </div>
                <div className="p-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[12px] font-bold text-gray-900 leading-tight">{t.id}. {t.name}</span>
                    <span className="flex gap-0.5 shrink-0">
                      {t.palette.slice(0, 4).map((c, i) => <span key={i} className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ background: c }} />)}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 leading-snug line-clamp-2">{t.tagline}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selected && Renderer && (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 入力フォーム */}
          <div className="flex-1 min-w-0 border border-gray-100 rounded-lg p-3 bg-gray-50/50">
            <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">{selected.description}</p>
            <div className="space-y-2.5">
              {selected.slots.map((s) => (
                <div key={s.key}>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    {s.label}{s.optional && <span className="text-gray-400 font-normal">（任意）</span>}
                  </label>
                  {s.type === "textarea" ? (
                    <textarea value={slots[s.key] ?? ""} onChange={(e) => update(s.key, e.target.value)} placeholder={s.placeholder} rows={2} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-900 outline-none focus:border-[#16a34a] resize-none" />
                  ) : s.type === "select" ? (
                    <select value={slots[s.key] ?? ""} onChange={(e) => update(s.key, e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-900 outline-none focus:border-[#16a34a]">
                      {s.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : s.type === "color" ? (
                    <div className="flex items-center gap-2">
                      <input type="color" value={slots[s.key] || "#16a34a"} onChange={(e) => update(s.key, e.target.value)} className="w-9 h-8 rounded border border-gray-200 cursor-pointer" />
                      <input type="text" value={slots[s.key] ?? ""} onChange={(e) => update(s.key, e.target.value)} placeholder="#16a34a" className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-900 outline-none focus:border-[#16a34a]" />
                    </div>
                  ) : (
                    <input type="text" value={slots[s.key] ?? ""} onChange={(e) => update(s.key, e.target.value)} placeholder={s.placeholder} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-900 outline-none focus:border-[#16a34a]" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ライブプレビュー */}
          <div ref={previewBoxRef} className="w-full lg:w-[460px] shrink-0">
            <p className="text-[11px] text-gray-500 mb-1.5">プレビュー（この通りに書き出されます）</p>
            <div
              className="rounded-lg overflow-hidden shadow-sm border border-gray-200"
              style={{ width: previewW, height: previewW * THUMB_H / THUMB_W }}
            >
              {/* 実寸ノード（キャプチャ対象）を縮小表示 */}
              <div style={{ width: THUMB_W, height: THUMB_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                <div ref={captureRef}>
                  <Renderer slots={slots} />
                </div>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={state === "saving"}
              className="w-full mt-2.5 px-4 py-2.5 bg-[#16a34a] text-white rounded-lg text-[13px] font-semibold hover:bg-[#15803d] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {state === "saving" ? (
                <span className="inline-flex items-center gap-1">
                  <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                  書き出し中...
                </span>
              ) : "このサムネを生成してメインに設定"}
            </button>
            {state === "done" && <p className="mt-2 text-[12px] text-green-600">メインサムネイルに設定しました</p>}
            {state === "error" && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
          </div>
        </div>
      )}

      {!selected && templates.length > 0 && (
        <p className="text-[12px] text-gray-400">デザインを選ぶと、見出しや配色を編集してその場でサムネを組めます。</p>
      )}
    </div>
  )
}
