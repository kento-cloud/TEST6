"use client"

import { toPng } from "html-to-image"
import { THUMB_W, THUMB_H } from "@/components/thumbnail-layouts"

/** レイアウトノード（実寸1280x720）をPNG Blobにラスタライズ。書き出し倍率1.5 → 1920x1080 */
export async function nodeToThumbnailBlob(node: HTMLElement, scale = 1.5): Promise<Blob> {
  const dataUrl = await toPng(node, {
    width: THUMB_W,
    height: THUMB_H,
    pixelRatio: scale,
    cacheBust: true,
    style: { transform: "none", transformOrigin: "top left", margin: "0" },
  })
  const res = await fetch(dataUrl)
  return res.blob()
}

/** 合成PNGを動画のサムネとしてアップロードし、新しいサムネIDを返す */
export async function uploadComposedThumbnail(videoId: string, blob: Blob, label = "composed"): Promise<string> {
  const fd = new FormData()
  fd.append("file", blob, `${label}.png`)
  const res = await fetch(`/api/videos/${videoId}/thumbnails`, { method: "POST", body: fd })
  if (!res.ok) {
    const d = await res.json().catch(() => ({}))
    throw new Error(d.error ?? "サムネのアップロードに失敗しました")
  }
  const { id } = await res.json()
  return id as string
}
