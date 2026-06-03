"use client"

import { useState, useEffect } from "react"
import { generateThumbnail, setPrimaryThumbnail } from "@/lib/admin-api"
import { useRouter } from "next/navigation"
import { ThumbnailComposer } from "@/components/ThumbnailComposer"

interface StylePreset {
  readonly id: string
  readonly name: string
  readonly prompt_template: string
}

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
  readonly diagram: ReadonlyArray<string>
  readonly sample: string
  readonly slots: ReadonlyArray<TemplateSlot>
}

interface GeneratedThumb {
  readonly id: string
  readonly filePath: string
}

interface Props {
  readonly videoId: string
  readonly videoTitle: string
  readonly count?: number
}

type Mode = "compose" | "template" | "custom"

export function ThumbnailGenerator({ videoId, videoTitle, count = 5 }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("compose")

  // --- テンプレートモード ---
  const [templates, setTemplates] = useState<TemplateMeta[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [slotValues, setSlotValues] = useState<Record<string, string>>({})

  // --- カスタム/プリセットモード ---
  const [presets, setPresets] = useState<StylePreset[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState("")
  const [prompt, setPrompt] = useState("")

  const [state, setState] = useState<"idle" | "generating" | "selecting" | "done" | "error">("idle")
  const [error, setError] = useState("")
  const [generated, setGenerated] = useState<GeneratedThumb[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [setting, setSetting] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)

  useEffect(() => {
    if (state !== "generating") { setElapsedSec(0); return }
    const timer = setInterval(() => setElapsedSec(s => s + 1), 1000)
    return () => clearInterval(timer)
  }, [state])

  useEffect(() => {
    fetch("/api/thumbnail-templates")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTemplates(data) })
      .catch(() => {})
    fetch("/api/thumbnail-presets")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPresets(data) })
      .catch(() => {})
  }, [])

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

  function selectTemplate(t: TemplateMeta) {
    setSelectedTemplateId(t.id)
    // スロットの初期値をセット
    const init: Record<string, string> = {}
    for (const s of t.slots) init[s.key] = s.default ?? ""
    setSlotValues(init)
  }

  function updateSlot(key: string, value: string) {
    setSlotValues((prev) => ({ ...prev, [key]: value }))
  }

  function handlePresetChange(presetId: string) {
    setSelectedPresetId(presetId)
    if (!presetId) return
    const preset = presets.find((p) => p.id === presetId)
    if (preset) setPrompt(preset.prompt_template.replace("{{title}}", videoTitle))
  }

  async function handleGenerate() {
    setState("generating")
    setError("")
    setGenerated([])
    setSelectedId(null)
    try {
      const data = mode === "template" && selectedTemplateId
        ? await generateThumbnail(videoId, "", count, undefined, { templateId: selectedTemplateId, slots: slotValues })
        : await generateThumbnail(videoId, prompt || "", count, selectedPresetId || undefined)
      const thumbs: GeneratedThumb[] = (data.thumbnails ?? []).map((t: { id: string; filePath: string }) => ({
        id: t.id, filePath: t.filePath,
      }))
      setGenerated(thumbs)
      setState("selecting")
    } catch (e) {
      setState("error")
      setError(e instanceof Error ? e.message : "生成に失敗しました")
    }
  }

  async function handleSelect() {
    if (!selectedId) return
    setSetting(true)
    try {
      await setPrimaryThumbnail(videoId, selectedId)
      setState("done")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "設定に失敗しました")
    }
    setSetting(false)
  }

  const canGenerate = mode === "template" ? !!selectedTemplateId : true

  return (
    <div>
      {/* モード切替タブ */}
      <div className="flex flex-wrap gap-1 mb-3 bg-gray-100 rounded-lg p-1 w-fit max-w-full">
        <button
          onClick={() => setMode("compose")}
          className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors cursor-pointer ${mode === "compose" ? "bg-white text-[#16a34a] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          レイアウト合成（推奨）
        </button>
        <button
          onClick={() => setMode("template")}
          className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors cursor-pointer ${mode === "template" ? "bg-white text-[#16a34a] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          AI画像生成
        </button>
        <button
          onClick={() => setMode("custom")}
          className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors cursor-pointer ${mode === "custom" ? "bg-white text-[#16a34a] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          カスタム / プリセット
        </button>
      </div>

      {/* ===== レイアウト合成モード（CSS→PNG、テキスト正確・高品質） ===== */}
      {mode === "compose" && (
        <ThumbnailComposer videoId={videoId} videoTitle={videoTitle} />
      )}

      {/* ===== テンプレートモード ===== */}
      {mode === "template" && (
        <div>
          {templates.length === 0 ? (
            <p className="text-[12px] text-gray-400 mb-3">テンプレートを読み込み中...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-3">
              {templates.map((t) => {
                const active = selectedTemplateId === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => selectTemplate(t)}
                    disabled={state === "generating"}
                    className={`group text-left rounded-xl border-2 overflow-hidden transition-all cursor-pointer disabled:opacity-50 ${active ? "border-[#16a34a] ring-2 ring-[#16a34a]/25" : "border-gray-200 hover:border-gray-300 bg-white"}`}
                  >
                    {/* 見本サムネ（このデザイン型の例） */}
                    <div className="relative aspect-video bg-gray-100 overflow-hidden">
                      <img
                        src={t.sample}
                        alt={`${t.name} のデザイン例`}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/55 text-white text-[9px] font-semibold rounded backdrop-blur-sm">デザイン例</span>
                      {active && (
                        <span className="absolute top-1 right-1 w-5 h-5 bg-[#16a34a] rounded-full flex items-center justify-center shadow">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </div>
                    {/* ラベル */}
                    <div className="p-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[12px] font-bold text-gray-900 leading-tight">{t.id}. {t.name}</span>
                        <span className="flex gap-0.5 shrink-0">
                          {t.palette.slice(0, 4).map((c, i) => (
                            <span key={i} className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ background: c }} />
                          ))}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 leading-snug line-clamp-2">{t.tagline}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* 選択テンプレのスロット入力 */}
          {selectedTemplate && (
            <div className="border border-gray-100 rounded-lg p-3 mb-3 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row gap-3 mb-2.5">
                <div className="relative w-full max-w-[120px] aspect-video rounded-md overflow-hidden shrink-0 border border-gray-200">
                  <img src={selectedTemplate.sample} alt={`${selectedTemplate.name} のデザイン例`} className="absolute inset-0 w-full h-full object-cover" />
                  <span className="absolute bottom-0 left-0 right-0 bg-black/55 text-white text-[8px] text-center py-0.5">このデザインで生成</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed flex-1">{selectedTemplate.description}</p>
              </div>
              <div className="space-y-2.5">
                {selectedTemplate.slots.map((s) => (
                  <div key={s.key}>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      {s.label}{s.optional && <span className="text-gray-400 font-normal">（任意）</span>}
                    </label>
                    {s.type === "textarea" ? (
                      <textarea
                        value={slotValues[s.key] ?? ""}
                        onChange={(e) => updateSlot(s.key, e.target.value)}
                        placeholder={s.placeholder}
                        rows={2}
                        disabled={state === "generating"}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-900 outline-none focus:border-[#16a34a] resize-none disabled:bg-gray-50"
                      />
                    ) : s.type === "select" ? (
                      <select
                        value={slotValues[s.key] ?? ""}
                        onChange={(e) => updateSlot(s.key, e.target.value)}
                        disabled={state === "generating"}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-900 outline-none focus:border-[#16a34a] disabled:bg-gray-50"
                      >
                        {s.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : s.type === "color" ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={slotValues[s.key] || "#16a34a"}
                          onChange={(e) => updateSlot(s.key, e.target.value)}
                          disabled={state === "generating"}
                          className="w-9 h-8 rounded border border-gray-200 cursor-pointer disabled:opacity-50"
                        />
                        <input
                          type="text"
                          value={slotValues[s.key] ?? ""}
                          onChange={(e) => updateSlot(s.key, e.target.value)}
                          placeholder="#16a34a"
                          disabled={state === "generating"}
                          className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-900 outline-none focus:border-[#16a34a] disabled:bg-gray-50"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={slotValues[s.key] ?? ""}
                        onChange={(e) => updateSlot(s.key, e.target.value)}
                        placeholder={s.placeholder}
                        disabled={state === "generating"}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-900 outline-none focus:border-[#16a34a] disabled:bg-gray-50"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== カスタム / プリセットモード ===== */}
      {mode === "custom" && (
        <div>
          {presets.length > 0 && (
            <div className="mb-3">
              <label className="block text-[12px] text-gray-400 mb-1">スタイルプリセット</label>
              <select
                value={selectedPresetId}
                onChange={(e) => handlePresetChange(e.target.value)}
                disabled={state === "generating"}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#16a34a] disabled:bg-gray-50"
              >
                <option value="">カスタム（自由入力）</option>
                {presets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <input
            type="text"
            value={prompt}
            onChange={(e) => { setPrompt(e.target.value); setSelectedPresetId("") }}
            placeholder="空欄ならデフォルト（キャッチコピー入りYouTube風）で生成"
            disabled={state === "generating"}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-[#16a34a] disabled:bg-gray-50 disabled:text-gray-400"
          />
          <p className="text-[11px] text-gray-400 mt-1">空欄のまま生成すると、タイトルからキャッチコピーを抽出したYouTube風サムネイルが自動生成されます</p>
        </div>
      )}

      {/* 生成ボタン（AI画像生成 / カスタムのみ） */}
      {mode !== "compose" && (
        <button
          onClick={handleGenerate}
          disabled={state === "generating" || !canGenerate}
          className="w-full mt-2 px-4 py-2.5 bg-[#16a34a] text-white rounded-lg text-[13px] font-semibold hover:bg-[#15803d] disabled:opacity-50 transition-colors cursor-pointer"
        >
          {state === "generating" ? (
            <span className="inline-flex items-center gap-1">
              <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
              {count}枚生成中... {elapsedSec}秒
            </span>
          ) : mode === "template" && !selectedTemplateId ? "デザインを選択してください" : `${count}枚生成`}
        </button>
      )}

      {/* 生成結果グリッド */}
      {state === "selecting" && generated.length > 0 && (
        <div className="mt-4">
          <p className="text-[13px] font-semibold text-gray-700 mb-2">
            {generated.length}枚生成されました — メインサムネイルを選択してください
          </p>
          <div className="flex gap-3 flex-wrap">
            {generated.map((thumb, i) => (
              <button
                key={thumb.id}
                onClick={() => setSelectedId(thumb.id)}
                className={`relative w-[150px] aspect-video rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                  selectedId === thumb.id
                    ? "border-[#16a34a] ring-2 ring-[#16a34a]/30 scale-[1.02]"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <img src={thumb.filePath} alt={`候補 ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                {selectedId === thumb.id && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-[#16a34a] rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                  {i + 1} / {generated.length}
                </div>
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3">
            <button onClick={handleGenerate} className="w-full sm:w-auto px-3 py-1.5 text-[12px] text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
              再生成する
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedId || setting}
              className="w-full sm:w-auto px-4 py-2 bg-[#16a34a] text-white rounded-lg text-[13px] font-semibold hover:bg-[#15803d] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {setting ? "設定中..." : "この画像をメインに設定"}
            </button>
          </div>
        </div>
      )}

      {state === "done" && (
        <div className="mt-3 p-3 bg-green-50 rounded-lg text-[13px] text-green-700">
          メインサムネイルを設定しました
        </div>
      )}
      {state === "error" && (
        <div className="mt-3 p-3 bg-red-50 rounded-lg">
          <p className="text-[13px] text-red-600">{error}</p>
          <button onClick={handleGenerate} className="text-[12px] text-red-500 hover:underline mt-1 cursor-pointer">リトライ</button>
        </div>
      )}
    </div>
  )
}
