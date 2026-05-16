"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { regenerateStep, updateAIContent } from "@/lib/admin-api"
import type { GenerationStepType } from "@/types/admin"
import Link from "next/link"

interface StylePreset {
  id: string
  name: string
  description: string
  prompt_template: string
}

interface Chapter {
  title: string
  startTime: number
  endTime: number
  summary: string
}

interface AIContent {
  summary: string | null
  chapters: string | null
  article: string | null
  tags: string | null
}

interface Props {
  readonly videoId: string
  readonly aiContent: AIContent | null
  readonly hasTranscript: boolean
  readonly processingStep: string
}

type StepKey = "summary" | "chapters" | "article" | "tags"

const STEP_CONFIG: { key: StepKey; label: string; processingKey: string; placeholder: string }[] = [
  { key: "summary", label: "要約", processingKey: "generating_summary", placeholder: "例: 専門用語を避けて平易に" },
  { key: "chapters", label: "チャプター", processingKey: "generating_chapters", placeholder: "例: チャプターを細かく分けて" },
  { key: "article", label: "記事", processingKey: "generating_article", placeholder: "例: 初心者向けにわかりやすく" },
  { key: "tags", label: "タグ", processingKey: "generating_tags", placeholder: "例: マーケティング関連のタグを多めに" },
]

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function PipelinePanel({ videoId, aiContent, hasTranscript, processingStep }: Props) {
  const router = useRouter()
  const [presets, setPresets] = useState<StylePreset[]>([])

  useEffect(() => {
    fetch("/api/ai-style-presets")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPresets(data) })
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-3">
      {STEP_CONFIG.map(({ key, label, processingKey, placeholder }) => (
        <PipelineStepRow
          key={key}
          videoId={videoId}
          stepKey={key}
          label={label}
          placeholder={placeholder}
          currentValue={aiContent?.[key] ?? null}
          isActive={processingStep === processingKey}
          hasTranscript={hasTranscript}
          presets={key === "article" ? presets : []}
        />
      ))}
    </div>
  )
}

interface StepRowProps {
  readonly videoId: string
  readonly stepKey: StepKey
  readonly label: string
  readonly placeholder: string
  readonly currentValue: string | null
  readonly isActive: boolean
  readonly hasTranscript: boolean
  readonly presets: StylePreset[]
}

function PipelineStepRow({ videoId, stepKey, label, placeholder, currentValue, isActive, hasTranscript, presets }: StepRowProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(currentValue ?? "")

  // Regenerate state
  const [showRegen, setShowRegen] = useState(false)
  const [regenInstruction, setRegenInstruction] = useState("")
  const [promptMode, setPromptMode] = useState<"append" | "override">("append")
  const [selectedPreset, setSelectedPreset] = useState("")
  const [regenerating, setRegenerating] = useState(false)
  const [regenResult, setRegenResult] = useState<string | null>(null)

  // Tag edit state
  const [tagInput, setTagInput] = useState("")

  // Save state
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const hasDone = !!currentValue
  const icon = isActive ? "⏳" : hasDone ? "✅" : "⬜"
  const textColor = isActive ? "text-blue-600" : hasDone ? "text-green-600" : "text-gray-400"

  function handlePresetChange(presetId: string) {
    setSelectedPreset(presetId)
    if (!presetId) return
    const preset = presets.find((p) => p.id === presetId)
    if (preset) setRegenInstruction(preset.prompt_template)
  }

  async function handleRegenerate() {
    setRegenerating(true)
    setMessage("")
    try {
      await regenerateStep(videoId, stepKey as GenerationStepType, regenInstruction || undefined, promptMode)
      // Fetch new content
      const res = await fetch(`/api/videos/${videoId}`)
      if (res.ok) {
        const video = await res.json()
        // Refetch ai_contents
        const aiRes = await fetch(`/api/videos/${videoId}/ai-contents`)
        if (aiRes.ok) {
          // Can't easily get just one field, reload the page
        }
      }
      // For now, show result via page reload approach
      // But first, fetch the updated content to show preview
      setRegenResult(null)
      setRegenerating(false)
      setShowRegen(false)
      setMessage("再生成完了")
      router.refresh()
    } catch (e) {
      setRegenerating(false)
      setMessage(e instanceof Error ? e.message : "再生成に失敗しました")
    }
  }

  async function handleSave() {
    setSaving(true)
    setMessage("")
    try {
      await updateAIContent(videoId, { [stepKey]: editValue })
      setMessage("保存しました")
      setEditing(false)
      router.refresh()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "保存に失敗しました")
    }
    setSaving(false)
  }

  function renderContent() {
    if (!currentValue) return <p className="text-[13px] text-gray-400">未生成</p>

    if (stepKey === "summary") {
      return <p className="text-[13px] text-gray-700 leading-[1.7]">{currentValue}</p>
    }

    if (stepKey === "chapters") {
      const chapters: Chapter[] = (() => {
        try { return typeof currentValue === "string" ? JSON.parse(currentValue) : currentValue }
        catch { return [] }
      })()
      return (
        <div className="space-y-1">
          {chapters.map((ch, i) => (
            <div key={i} className="flex gap-2 text-[12px]">
              <span className="text-gray-400 font-mono shrink-0">{formatTime(ch.startTime)}-{formatTime(ch.endTime)}</span>
              <span className="text-gray-700 font-semibold">{ch.title}</span>
              <span className="text-gray-500">{ch.summary}</span>
            </div>
          ))}
        </div>
      )
    }

    if (stepKey === "article") {
      const preview = currentValue.slice(0, 200)
      return (
        <div>
          <p className="text-[13px] text-gray-700 leading-[1.7]">{preview}{currentValue.length > 200 ? "..." : ""}</p>
          <Link href={`/admin/videos/${videoId}/article`} className="text-[12px] text-[#cd1cfa] hover:underline mt-1 inline-block">
            記事エディタで開く →
          </Link>
        </div>
      )
    }

    if (stepKey === "tags") {
      const tags: string[] = (() => {
        try { return typeof currentValue === "string" ? JSON.parse(currentValue) : currentValue }
        catch { return [] }
      })()
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[11px] rounded-full">{tag}</span>
          ))}
        </div>
      )
    }

    return null
  }

  function renderEditForm() {
    if (stepKey === "tags") {
      // タグは JSON 配列
      const tags: string[] = (() => {
        try { return JSON.parse(editValue) }
        catch { return [] }
      })()

      function addTag() {
        if (!tagInput.trim()) return
        const updated = [...tags, tagInput.trim()]
        setEditValue(JSON.stringify(updated))
        setTagInput("")
      }

      function removeTag(index: number) {
        const updated = tags.filter((_, i) => i !== index)
        setEditValue(JSON.stringify(updated))
      }

      return (
        <div>
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-[11px] rounded-full">
                {tag}
                <button onClick={() => removeTag(i)} className="text-purple-400 hover:text-red-500 cursor-pointer">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
              placeholder="タグを入力してEnter"
              className="flex-1 px-2 py-1 border border-gray-200 rounded text-[12px] outline-none focus:border-[#cd1cfa]"
            />
            <button onClick={addTag} className="px-2 py-1 bg-gray-100 rounded text-[11px] text-gray-600 hover:bg-gray-200 cursor-pointer">追加</button>
          </div>
        </div>
      )
    }

    return (
      <textarea
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="w-full px-3 py-2 text-[13px] text-gray-700 leading-[1.7] font-mono bg-gray-50 rounded-lg border border-gray-200 outline-none focus:border-[#cd1cfa] resize-none"
        rows={stepKey === "article" ? 12 : stepKey === "chapters" ? 8 : 4}
      />
    )
  }

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
        <button
          onClick={() => hasDone ? setExpanded(!expanded) : null}
          className={`flex items-center gap-2 ${hasDone ? "cursor-pointer" : "cursor-default"}`}
        >
          <span className="text-[14px]">{icon}</span>
          <span className={`text-[13px] font-medium ${textColor}`}>{label}</span>
          {hasDone && (
            <span className="text-[10px] text-gray-400">{expanded ? "▲" : "▼"}</span>
          )}
        </button>
        <div className="flex items-center gap-1.5">
          {message && (
            <span className={`text-[11px] ${message.includes("失敗") ? "text-red-500" : "text-green-600"}`}>{message}</span>
          )}
          {isActive && (
            <span className="inline-flex items-center gap-1 text-[11px] text-blue-500">
              <span className="animate-spin w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full" />
              生成中
            </span>
          )}
          {hasTranscript && !isActive && (
            <>
              {hasDone && (
                <button
                  onClick={() => { setEditing(!editing); setExpanded(true); setEditValue(currentValue ?? "") }}
                  className="px-2 py-0.5 text-[11px] text-gray-500 hover:bg-gray-200 rounded cursor-pointer"
                >
                  {editing ? "キャンセル" : "編集"}
                </button>
              )}
              <button
                onClick={() => { setShowRegen(!showRegen); setExpanded(true) }}
                className="px-2.5 py-0.5 border border-[#cd1cfa] text-[#cd1cfa] rounded text-[11px] font-semibold hover:bg-purple-50 cursor-pointer"
              >
                再生成
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && hasDone && (
        <div className="px-3 py-2 border-t border-gray-100">
          {editing ? (
            <div>
              {renderEditForm()}
              <div className="flex gap-1.5 justify-end mt-2">
                <button
                  onClick={() => setEditing(false)}
                  className="px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-50 rounded cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1 bg-[#cd1cfa] text-white rounded text-[11px] font-semibold hover:bg-[#b018d8] disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "保存中..." : "保存"}
                </button>
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      )}

      {/* Regenerate Panel */}
      {showRegen && (
        <div className="px-3 py-3 border-t border-purple-100 bg-purple-50">
          <p className="text-[12px] font-semibold text-gray-700 mb-1.5">{label}を再生成</p>
          {stepKey === "article" && presets.length > 0 && (
            <div className="mb-2">
              <select
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full px-2 py-1.5 border border-purple-200 rounded-lg text-[12px] text-gray-900 outline-none focus:border-[#cd1cfa] bg-white"
              >
                <option value="">カスタム（自由入力）</option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.description}</option>
                ))}
              </select>
            </div>
          )}
          <textarea
            value={regenInstruction}
            onChange={(e) => { setRegenInstruction(e.target.value); setSelectedPreset("") }}
            placeholder={placeholder}
            className="w-full px-2 py-1.5 border border-purple-200 rounded-lg text-[12px] text-gray-900 outline-none focus:border-[#cd1cfa] resize-none bg-white"
            rows={2}
          />
          {regenInstruction && (
            <div className="flex gap-3 mt-1.5">
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="radio" checked={promptMode === "append"} onChange={() => setPromptMode("append")} className="accent-[#cd1cfa]" />
                <span className="text-[11px] text-gray-600">ベースに追加</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="radio" checked={promptMode === "override"} onChange={() => setPromptMode("override")} className="accent-[#cd1cfa]" />
                <span className="text-[11px] text-gray-600">この指示のみ</span>
              </label>
            </div>
          )}
          <div className="flex gap-1.5 justify-end mt-2">
            <button
              onClick={() => setShowRegen(false)}
              className="px-2 py-1 text-[11px] text-gray-500 hover:bg-white rounded cursor-pointer"
            >
              キャンセル
            </button>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="px-3 py-1 bg-orange-500 text-white rounded text-[11px] font-semibold hover:bg-orange-600 disabled:opacity-50 cursor-pointer"
            >
              {regenerating ? "生成中..." : "再生成する（上書き）"}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">現在の内容が上書きされます</p>
        </div>
      )}
    </div>
  )
}
