"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteVideo } from "@/lib/admin-api"

export function DeleteButton({ videoId }: { videoId: string }) {
  const router = useRouter()
  const [state, setState] = useState<"idle" | "confirming" | "deleting" | "error">("idle")
  const [error, setError] = useState("")

  async function handleDelete() {
    setState("deleting")
    try {
      await deleteVideo(videoId)
      router.push("/admin/videos")
    } catch (e) {
      setState("error")
      setError(e instanceof Error ? e.message : "削除に失敗しました")
    }
  }

  if (state === "confirming" || state === "deleting" || state === "error") {
    return (
      <div className="flex items-center gap-2">
        {state === "error" && <span className="text-[11px] text-red-500">{error}</span>}
        <button
          onClick={handleDelete}
          disabled={state === "deleting"}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-[14px] font-semibold hover:bg-red-700 disabled:opacity-50 cursor-pointer"
        >
          {state === "deleting" ? (
            <span className="inline-flex items-center gap-1">
              <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
              削除中
            </span>
          ) : "本当に削除"}
        </button>
        <button
          onClick={() => { setState("idle"); setError(""); }}
          disabled={state === "deleting"}
          className="px-4 py-2 border border-gray-200 rounded-lg text-[14px] text-gray-600 hover:bg-gray-50 cursor-pointer"
        >
          キャンセル
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setState("confirming")}
      className="px-4 py-2 border border-red-200 text-red-500 rounded-lg text-[14px] hover:bg-red-50 cursor-pointer"
    >
      削除
    </button>
  )
}
