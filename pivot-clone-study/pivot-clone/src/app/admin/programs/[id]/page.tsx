"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface ProgramData {
  id: number
  name: string
  description: string | null
  isActive: number | null
  createdAt: string | null
}

interface FormState {
  program: ProgramData | null
  name: string
  description: string
  isActive: boolean
  loading: boolean
  saving: boolean
  error: string | null
  success: boolean
}

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [state, setState] = useState<FormState>({
    program: null,
    name: "",
    description: "",
    isActive: true,
    loading: true,
    saving: false,
    error: null,
    success: false,
  })

  useEffect(() => {
    fetch(`/api/programs/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("番組が見つかりません")
        return res.json()
      })
      .then((data) => {
        setState((prev) => ({
          ...prev,
          program: data,
          name: data.name,
          description: data.description ?? "",
          isActive: !!data.isActive,
          loading: false,
        }))
      })
      .catch((err) => {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : "読み込みに失敗しました",
          loading: false,
        }))
      })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!state.name.trim()) {
      setState((prev) => ({ ...prev, error: "番組名を入力してください" }))
      return
    }

    setState((prev) => ({ ...prev, saving: true, error: null, success: false }))

    try {
      const res = await fetch(`/api/programs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name.trim(),
          description: state.description.trim(),
          isActive: state.isActive ? 1 : 0,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "更新に失敗しました")
      }

      setState((prev) => ({ ...prev, saving: false, success: true }))
      router.refresh()
    } catch (err) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: err instanceof Error ? err.message : "更新に失敗しました",
      }))
    }
  }

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#cd1cfa] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (state.error && !state.program) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 text-[14px]">{state.error}</p>
        <Link href="/admin/programs" className="text-[13px] text-[#cd1cfa] mt-3 inline-block">← 番組一覧に戻る</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/programs" className="text-[13px] text-gray-400 hover:text-gray-600">← 番組一覧</Link>
      </div>

      <h1 className="text-[24px] font-bold text-gray-900 mb-6">番組編集</h1>

      <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-[600px]">
        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5">
            <p className="text-red-700 text-[13px]">{state.error}</p>
          </div>
        )}
        {state.success && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-5">
            <p className="text-green-700 text-[13px]">番組を更新しました</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-[13px] font-semibold text-gray-700 mb-1">
              番組名 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={state.name}
              onChange={(e) => setState((prev) => ({ ...prev, name: e.target.value, success: false }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:border-[#cd1cfa] focus:ring-1 focus:ring-[#cd1cfa] transition-colors"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-[13px] font-semibold text-gray-700 mb-1">
              説明
            </label>
            <textarea
              id="description"
              value={state.description}
              onChange={(e) => setState((prev) => ({ ...prev, description: e.target.value, success: false }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:border-[#cd1cfa] focus:ring-1 focus:ring-[#cd1cfa] transition-colors resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={state.isActive}
              onChange={(e) => setState((prev) => ({ ...prev, isActive: e.target.checked, success: false }))}
              className="w-4 h-4 rounded border-gray-300 text-[#cd1cfa] focus:ring-[#cd1cfa]"
            />
            <label htmlFor="isActive" className="text-[13px] font-semibold text-gray-700">
              有効
            </label>
          </div>

          {state.program && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-[12px] text-gray-400">
                ID: {state.program.id} | 作成日: {state.program.createdAt?.slice(0, 10) ?? "—"}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={state.saving}
              className="px-6 py-2.5 bg-[#cd1cfa] text-white rounded-lg text-[14px] font-semibold hover:bg-[#b018d8] transition-colors disabled:opacity-50"
            >
              {state.saving ? "保存中..." : "保存"}
            </button>
            <Link
              href="/admin/programs"
              className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-[14px] font-semibold hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
