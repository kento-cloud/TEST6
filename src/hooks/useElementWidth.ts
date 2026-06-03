"use client"

import { useState, useEffect, useRef } from "react"

/**
 * 要素の実幅を監視し、maxWidth で頭打ちした表示幅を返す。
 * モバイルでコンテナ幅に合わせてプレビューを縮小するために使う。
 */
export function useElementWidth<T extends HTMLElement>(maxWidth: number) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(maxWidth)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setWidth(Math.min(el.clientWidth || maxWidth, maxWidth))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [maxWidth])

  return [ref, width] as const
}
