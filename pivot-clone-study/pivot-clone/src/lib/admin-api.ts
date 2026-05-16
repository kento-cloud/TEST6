/**
 * 管理画面用APIクライアント
 * 全API呼び出しをここに集約。バックエンド接続時はここだけ変更すればよい。
 */

import type { GenerationStepType } from "@/types/admin"

// === Videos ===

export async function fetchVideos() {
  const res = await fetch("/api/videos")
  if (!res.ok) throw new Error("動画一覧の取得に失敗しました")
  return res.json()
}

export async function fetchVideo(id: string) {
  const res = await fetch(`/api/videos/${id}`)
  if (!res.ok) throw new Error("動画の取得に失敗しました")
  return res.json()
}

export async function uploadVideo(formData: FormData) {
  const res = await fetch("/api/videos", { method: "POST", body: formData })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "アップロードに失敗しました")
  }
  return res.json()
}

export async function importYouTube(url: string, categoryCode?: string) {
  const res = await fetch("/api/videos/import-youtube", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, categoryCode }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "YouTube登録に失敗しました")
  }
  return res.json()
}

export async function deleteVideo(id: string) {
  const res = await fetch(`/api/videos/${id}`, { method: "DELETE" })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "削除に失敗しました")
  }
  return res.json()
}

// === Transcription ===

export async function transcribeVideo(id: string, manualText?: string) {
  const res = await fetch(`/api/videos/${id}/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: manualText ? JSON.stringify({ text: manualText }) : "{}",
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "文字起こしに失敗しました")
  }
  return res.json()
}

// === AI Generation ===

export async function generateAll(id: string, articleInstruction?: string) {
  const res = await fetch(`/api/videos/${id}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ articleInstruction }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "AI生成に失敗しました")
  }
  return res.json()
}

export async function regenerateStep(id: string, step: GenerationStepType, articleInstruction?: string, promptMode?: "append" | "override") {
  const res = await fetch(`/api/videos/${id}/regenerate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ step, articleInstruction, promptMode }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? `${step}の再生成に失敗しました`)
  }
  return res.json()
}

// === Publish ===

export async function publishVideo(id: string) {
  const res = await fetch(`/api/videos/${id}/publish`, { method: "POST" })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "公開に失敗しました")
  }
  return res.json()
}

export async function unpublishVideo(id: string) {
  const res = await fetch(`/api/videos/${id}/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "unpublish" }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "非公開化に失敗しました")
  }
  return res.json()
}

export async function resetVideo(id: string) {
  const res = await fetch(`/api/videos/${id}/reset`, { method: "POST" })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "リセットに失敗しました")
  }
  return res.json()
}

// === Thumbnails ===

export async function generateThumbnail(id: string, prompt: string) {
  const res = await fetch(`/api/videos/${id}/thumbnails/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "サムネイル生成に失敗しました")
  }
  return res.json()
}

export async function setPrimaryThumbnail(videoId: string, thumbId: string) {
  const res = await fetch(`/api/videos/${videoId}/thumbnails/${thumbId}`, { method: "PUT" })
  if (!res.ok) throw new Error("プライマリ設定に失敗しました")
  return res.json()
}

export async function deleteThumbnail(videoId: string, thumbId: string) {
  const res = await fetch(`/api/videos/${videoId}/thumbnails/${thumbId}`, { method: "DELETE" })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "サムネイル削除に失敗しました")
  }
  return res.json()
}

// === Auth ===

export async function login(password: string) {
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "ログインに失敗しました")
  }
  return res.json()
}

export async function logout() {
  await fetch("/api/admin/logout", { method: "POST" })
}
