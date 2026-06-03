"use client"

/**
 * サムネイル レイアウト合成レンダラー（横型 A〜E）
 *
 * docs/thumbnail-design-system.md のデザイン定義を、CSSレイアウトとして実装。
 * このコンポーネントが「ライブプレビュー」かつ「PNG書き出しの元ノード」になる（プレビュー＝出力）。
 *
 * ベースキャンバスは 1280×720（16:9）。プレビューは親側で transform: scale して縮小表示する。
 */

export const THUMB_W = 1280
export const THUMB_H = 720

const GOTHIC = '"Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", "Meiryo", sans-serif'

export interface LayoutProps {
  readonly slots: Record<string, string>
}

function v(slots: Record<string, string>, key: string, fallback = ""): string {
  const x = slots[key]
  return x !== undefined && x !== "" ? x : fallback
}

/** \n を改行として描画するためのスタイル */
const preLine: React.CSSProperties = { whiteSpace: "pre-line" }

/** キーワードを accent 色で塗り分けたテキスト断片を返す */
function highlight(text: string, keyword: string, accent: string): React.ReactNode {
  if (!keyword) return text
  const idx = text.indexOf(keyword)
  if (idx < 0) return text
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: accent }}>{keyword}</span>
      {text.slice(idx + keyword.length)}
    </>
  )
}

const base: React.CSSProperties = {
  width: THUMB_W,
  height: THUMB_H,
  position: "relative",
  overflow: "hidden",
  fontFamily: GOTHIC,
  color: "#fff",
}

// ===== A: 対談・インタビュー =====
function LayoutA({ slots }: LayoutProps) {
  const headline = v(slots, "headline", "見出しを入力")
  const brand = v(slots, "brand", "AI MEDIA TALK")
  const genre = v(slots, "genre")
  const episodeNo = v(slots, "episodeNo")
  const accent = v(slots, "accent", "#38bdf8")
  return (
    <div style={{ ...base, background: `linear-gradient(135deg, #0a1812 0%, #0d2238 55%, ${accent}33 100%)` }}>
      {/* 装飾（人物エリアの代わり） */}
      <div style={{ position: "absolute", right: -120, bottom: -120, width: 560, height: 560, borderRadius: "50%", background: `radial-gradient(circle, ${accent}55, transparent 70%)` }} />
      <div style={{ position: "absolute", right: 120, top: 90, width: 220, height: 220, borderRadius: "50%", border: `2px solid ${accent}66` }} />
      {episodeNo && (
        <div style={{ position: "absolute", top: 44, right: 56, fontSize: 40, fontWeight: 800, color: accent }}>{episodeNo}</div>
      )}
      <div style={{ position: "absolute", top: 70, left: 64, right: 64, fontSize: 104, fontWeight: 900, lineHeight: 1.04, letterSpacing: -2, textShadow: "0 4px 24px rgba(0,0,0,0.5)", ...preLine }}>
        {headline}
      </div>
      {/* ブランドロックアップ（左下） */}
      <div style={{ position: "absolute", left: 64, bottom: 56, display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 44, fontWeight: 900, letterSpacing: 1 }}>{brand}</span>
        {genre && (
          <span style={{ fontSize: 30, fontWeight: 800, padding: "6px 18px", borderRadius: 8, background: `linear-gradient(90deg, ${accent}, #2563eb)`, color: "#fff" }}>{genre}</span>
        )}
      </div>
    </div>
  )
}

// ===== B: ナンバー型インタビュー =====
function LayoutB({ slots }: LayoutProps) {
  const number = v(slots, "number", "9")
  const unit = v(slots, "unit", "questions")
  const headline = v(slots, "headline", "見出しを入力")
  const accent = v(slots, "accent", "#f5d90a")
  return (
    <div style={{ ...base, background: "#2b2f24", display: "flex", alignItems: "center" }}>
      <div style={{ flex: "0 0 50%", display: "flex", alignItems: "baseline", paddingLeft: 64 }}>
        <span style={{ fontSize: 460, fontWeight: 800, lineHeight: 0.8, color: "#fff" }}>{number}</span>
        <span style={{ fontSize: 56, fontWeight: 400, color: "#cdd2c4", marginLeft: 8 }}>{unit}</span>
      </div>
      <div style={{ flex: 1, paddingRight: 64 }}>
        <div style={{ display: "inline-block", borderLeft: `10px solid ${accent}`, paddingLeft: 24, fontSize: 80, fontWeight: 900, lineHeight: 1.12, ...preLine }}>
          {headline}
        </div>
      </div>
    </div>
  )
}

// ===== C: ハイテンション（数字インパクト） =====
function LayoutC({ slots }: LayoutProps) {
  const headline = v(slots, "headline", "見出しを入力")
  const brand = v(slots, "brand")
  const accent = v(slots, "accent", "#e11d2a")
  const lines = headline.split("\n")
  const top = lines[0] ?? ""
  const rest = lines.slice(1).join("\n")
  return (
    <div style={{ ...base, background: `radial-gradient(120% 100% at 30% 0%, ${accent} 0%, #9c0f18 100%)` }}>
      {/* 上段：白文字＋黒フチ */}
      <div style={{ position: "absolute", top: 70, left: 56, right: 56, fontSize: 116, fontWeight: 900, color: "#fff", letterSpacing: -2, WebkitTextStroke: "8px #111", paintOrder: "stroke fill" as React.CSSProperties["paintOrder"], textShadow: "0 6px 0 rgba(0,0,0,0.25)" }}>
        {top}
      </div>
      {/* 下段：黄ボックスに黒文字 */}
      {rest && (
        <div style={{ position: "absolute", top: 250, left: 56, display: "inline-block", background: "#ffd400", color: "#111", fontSize: 104, fontWeight: 900, lineHeight: 1.08, padding: "10px 28px", borderRadius: 10, transform: "rotate(-1.5deg)", ...preLine }}>
          {rest}
        </div>
      )}
      {/* 記号 */}
      <div style={{ position: "absolute", right: 70, top: 120, fontSize: 120, fontWeight: 900, color: "#ffd400", textShadow: "0 4px 0 #111" }}>↑</div>
      <div style={{ position: "absolute", right: 80, bottom: 120, fontSize: 90, fontWeight: 900, color: "#fff", WebkitTextStroke: "5px #111" }}>¥</div>
      {brand && (
        <div style={{ position: "absolute", left: 56, bottom: 48, fontSize: 34, fontWeight: 800, background: "rgba(0,0,0,0.45)", padding: "6px 18px", borderRadius: 8 }}>{brand}</div>
      )}
    </div>
  )
}

// ===== D: ランキング・比較 =====
function LayoutD({ slots }: LayoutProps) {
  const badge = v(slots, "badge", "ランキング超分析")
  const headline = v(slots, "headline", "見出しを入力")
  const keyword = v(slots, "keyword")
  const item = v(slots, "item")
  const accent = v(slots, "accent", "#22c55e")
  return (
    <div style={{ ...base, background: "linear-gradient(160deg, #111827 0%, #1f2937 100%)" }}>
      <div style={{ position: "absolute", top: 48, left: 56, background: accent, color: "#06210f", fontSize: 30, fontWeight: 900, padding: "8px 20px", borderRadius: 999 }}>{badge}</div>
      <div style={{ position: "absolute", top: 120, left: 56, right: 56, fontSize: 92, fontWeight: 900, lineHeight: 1.08, ...preLine }}>
        {highlight(headline, keyword, accent)}
      </div>
      {/* 4枠の等間隔ランキング枠（人物プレースホルダ） */}
      <div style={{ position: "absolute", left: 56, right: 56, bottom: 56, display: "flex", gap: 20, justifyContent: "space-between" }}>
        {[1, 2, 3, 4].map((n) => (
          <div key={n} style={{ flex: 1, height: 150, borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `2px solid ${accent}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, fontWeight: 900, color: `${accent}` }}>{n}</div>
        ))}
      </div>
      {item && (
        <div style={{ position: "absolute", right: 60, top: 60, fontSize: 34, fontWeight: 800, color: "#e5e7eb" }}>{item}</div>
      )}
    </div>
  )
}

// ===== E: サブブランド（虎の巻型） =====
function LayoutE({ slots }: LayoutProps) {
  const headline = v(slots, "headline", "見出しを入力")
  const sb1 = v(slots, "subbrand1", "ビジネス")
  const sb2 = v(slots, "subbrand2", "虎の巻")
  const accent = v(slots, "accent", "#16a34a")
  return (
    <div style={{ ...base, background: `radial-gradient(closest-side at 50% 45%, ${tint(accent, 30)} 0%, ${accent} 60%, ${shade(accent, 20)} 100%)` }}>
      {/* 同心円の装飾 */}
      <div style={{ position: "absolute", top: "45%", left: "50%", transform: "translate(-50%,-50%)", width: 1100, height: 1100, borderRadius: "50%", border: `60px solid ${tint(accent, 12)}`, opacity: 0.5 }} />
      <div style={{ position: "absolute", top: 90, left: 64, right: 64, fontSize: 100, fontWeight: 900, lineHeight: 1.08, textShadow: "0 4px 14px rgba(0,0,0,0.3)", ...preLine }}>
        {headline}
      </div>
      {/* サブブランドロゴ（左下） */}
      <div style={{ position: "absolute", left: 64, bottom: 52 }}>
        <div style={{ fontSize: 52, fontWeight: 900, color: "#fff", lineHeight: 1, marginBottom: 6 }}>{sb1}</div>
        <div style={{ display: "inline-block", background: "#f5e800", color: "#111", fontSize: 64, fontWeight: 900, fontStyle: "italic", padding: "6px 22px", borderRadius: 6, transform: "skewX(-6deg)" }}>{sb2}</div>
      </div>
    </div>
  )
}

// ---- カラーユーティリティ（簡易 hex 操作） ----
function clamp(n: number) { return Math.max(0, Math.min(255, Math.round(n))) }
function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  const s = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  return [parseInt(s.slice(0, 2), 16) || 0, parseInt(s.slice(2, 4), 16) || 0, parseInt(s.slice(4, 6), 16) || 0]
}
function toHex(r: number, g: number, b: number) { return "#" + [r, g, b].map((x) => clamp(x).toString(16).padStart(2, "0")).join("") }
function tint(hex: string, pct: number) { const [r, g, b] = parseHex(hex); const f = pct / 100; return toHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f) }
function shade(hex: string, pct: number) { const [r, g, b] = parseHex(hex); const f = 1 - pct / 100; return toHex(r * f, g * f, b * f) }

// ---- レジストリ ----
export const LAYOUT_RENDERERS: Record<string, (p: LayoutProps) => React.ReactNode> = {
  A: LayoutA,
  B: LayoutB,
  C: LayoutC,
  D: LayoutD,
  E: LayoutE,
}

export function hasLayout(id: string): boolean {
  return id in LAYOUT_RENDERERS
}
