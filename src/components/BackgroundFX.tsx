"use client"

import dynamic from "next/dynamic"

// three.js を含む LightPillar はクライアント専用・遅延ロード（初期バンドルから分離）
const LightPillar = dynamic(() => import("./LightPillar"), { ssr: false })

/** フロント共通の装飾背景（光の柱）。固定・クリック透過。 */
export function BackgroundFX() {
  return (
    <div aria-hidden className="fixed inset-0 z-0 pointer-events-none">
      <LightPillar
        topColor="#8bc1a1"
        bottomColor="#e3a5e1"
        intensity={0.6}
        rotationSpeed={0.1}
        interactive={false}
        glowAmount={0.002}
        pillarWidth={10}
        pillarHeight={0.4}
        noiseIntensity={2}
        pillarRotation={244}
        quality="medium"
        mixBlendMode="screen"
      />
    </div>
  )
}
