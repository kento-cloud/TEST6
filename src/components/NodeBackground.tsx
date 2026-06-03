/**
 * 背景装飾: 六角形ノードのネットワーク（NODE風）を奥行きのある多層構成で描画。
 *
 * 構成（奥 → 手前）:
 *   1. アンビエント発光（ソフトな緑のブルーム）
 *   2. 遠景レイヤー: 小さな六角形を散りばめ、ゆっくりドリフト（パララックス）
 *   3. 近景レイヤー: 六角形ノード + 接続ライン + 発光ハロー（脈動）
 *   4. ビネット: 周辺をわずかに暗くしてコンテンツを引き立てる
 *
 * すべて装飾（aria-hidden / pointer-events-none）。位置は決定的でSSR安全。
 */

const VBW = 1440
const VBH = 900

/** 六角形（フラットトップ）の頂点列 */
function hex(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i)
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(" ")
}

type Node = { cx: number; cy: number; r: number; glow?: "a" | "b" }

const NODES: Node[] = [
  { cx: 150, cy: 170, r: 78, glow: "a" },
  { cx: 330, cy: 330, r: 30 },
  { cx: 95, cy: 540, r: 50, glow: "b" },
  { cx: 250, cy: 740, r: 26 },
  { cx: 540, cy: 200, r: 38 },
  { cx: 470, cy: 540, r: 64, glow: "a" },
  { cx: 705, cy: 365, r: 28 },
  { cx: 845, cy: 150, r: 54, glow: "b" },
  { cx: 905, cy: 575, r: 36 },
  { cx: 1080, cy: 250, r: 80, glow: "a" },
  { cx: 1195, cy: 480, r: 32 },
  { cx: 1300, cy: 165, r: 42, glow: "b" },
  { cx: 1330, cy: 700, r: 60, glow: "a" },
  { cx: 1090, cy: 775, r: 28 },
  { cx: 700, cy: 790, r: 46, glow: "b" },
  { cx: 380, cy: 80, r: 20 },
]

const LINKS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [1, 4], [4, 5], [5, 6], [6, 7], [4, 7],
  [6, 8], [7, 9], [9, 10], [9, 11], [10, 12], [8, 12], [5, 14],
  [8, 13], [13, 12], [10, 8], [0, 4], [3, 14], [15, 4], [6, 5], [11, 9],
]

/** 遠景の小六角形（決定的に生成 — 簡易LCGでSSR/CSR一致） */
function buildFarHexes() {
  let seed = 20250722
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  const out: { cx: number; cy: number; r: number; o: number }[] = []
  for (let i = 0; i < 34; i++) {
    out.push({
      cx: Math.round(rnd() * VBW),
      cy: Math.round(rnd() * VBH),
      r: 8 + Math.round(rnd() * 16),
      o: 0.05 + rnd() * 0.07,
    })
  }
  return out
}
const FAR = buildFarHexes()

export function NodeBackground() {
  return (
    <div aria-hidden className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* 0. ベースの奥行きグラデ（上部に淡い緑、周辺へ深い闇） */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(125% 90% at 50% -8%, #123a2a 0%, #0a1812 42%, #060f0a 100%)" }}
      />

      {/* 1. アンビエント発光 */}
      <div
        className="absolute -left-[15%] -top-[20%] h-[60vw] w-[60vw] rounded-full opacity-60 blur-[130px]"
        style={{ background: "radial-gradient(circle, rgba(22,163,74,0.30), transparent 68%)" }}
      />
      <div
        className="absolute -right-[18%] top-[45%] h-[55vw] w-[55vw] rounded-full opacity-50 blur-[140px]"
        style={{ background: "radial-gradient(circle, rgba(13,148,136,0.24), transparent 70%)" }}
      />

      {/* 2. 遠景レイヤー（小六角形・ゆっくりドリフト） */}
      <svg
        className="node-layer-far absolute left-1/2 top-1/2 h-[125%] w-[125%] -translate-x-1/2 -translate-y-1/2"
        viewBox={`0 0 ${VBW} ${VBH}`}
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <g stroke="#22c55e" strokeWidth="1" strokeLinejoin="round">
          {FAR.map((h, i) => (
            <polygon key={i} points={hex(h.cx, h.cy, h.r)} strokeOpacity={h.o} />
          ))}
        </g>
      </svg>

      {/* 3. 近景レイヤー（ノードネットワーク） */}
      <svg
        className="node-layer absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2"
        viewBox={`0 0 ${VBW} ${VBH}`}
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <radialGradient id="nodeHaloA" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nodeHaloB" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="linkGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.0" />
            <stop offset="50%" stopColor="#22c55e" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0.0" />
          </linearGradient>
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 接続ライン */}
        <g stroke="url(#linkGrad)" strokeWidth="1.1">
          {LINKS.map(([a, b], i) => (
            <line key={i} x1={NODES[a].cx} y1={NODES[a].cy} x2={NODES[b].cx} y2={NODES[b].cy} />
          ))}
        </g>

        {/* ノード中心ドット */}
        <g fill="#4ade80" fillOpacity="0.45">
          {NODES.map((n, i) => (
            <circle key={i} cx={n.cx} cy={n.cy} r="2.2" />
          ))}
        </g>

        {/* 発光ハロー */}
        {NODES.map((n, i) =>
          n.glow ? (
            <circle
              key={`h${i}`}
              cx={n.cx}
              cy={n.cy}
              r={n.r * 1.9}
              fill={n.glow === "a" ? "url(#nodeHaloA)" : "url(#nodeHaloB)"}
              className={i % 2 === 0 ? "node-pulse" : "node-pulse-slow"}
            />
          ) : null
        )}

        {/* 六角形ノード（外周 + 内周の二重リングで精緻に） */}
        <g filter="url(#nodeGlow)">
          {NODES.map((n, i) => {
            const accent = n.glow === "a" ? "#4ade80" : n.glow === "b" ? "#2dd4bf" : "#16a34a"
            const op = n.glow ? 0.55 : 0.24
            const cls = n.glow ? (i % 2 === 0 ? "node-pulse" : "node-pulse-slow") : undefined
            return (
              <g key={`p${i}`} className={cls}>
                <polygon
                  points={hex(n.cx, n.cy, n.r)}
                  fill="#16a34a"
                  fillOpacity={n.glow ? 0.05 : 0.02}
                  stroke={accent}
                  strokeOpacity={op}
                  strokeWidth={n.glow ? 1.5 : 1}
                  strokeLinejoin="round"
                />
                {n.glow && (
                  <polygon
                    points={hex(n.cx, n.cy, n.r - 7)}
                    stroke={accent}
                    strokeOpacity={op * 0.4}
                    strokeWidth="0.8"
                    strokeLinejoin="round"
                  />
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* 4. ビネット */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(135% 115% at 50% 32%, transparent 52%, rgba(3,10,6,0.62) 100%)" }}
      />
    </div>
  )
}
