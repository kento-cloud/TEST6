import { Sidebar } from "@/components/Sidebar"
import { Footer } from "@/components/Footer"
import { BackToTop } from "@/components/BackToTop"
import { BackgroundFX } from "@/components/BackgroundFX"

export default function FrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="relative bg-[#060f0a] text-white">
      {/* 背景ベース: 奥行きのある緑グラデ */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: "radial-gradient(125% 90% at 50% -8%, #123a2a 0%, #0a1812 42%, #060f0a 100%)" }}
      />
      {/* 背景: LightPillar（Three.js の光の柱・遅延ロード） */}
      <BackgroundFX />
      <div className="relative z-10 flex flex-row items-stretch w-full min-h-screen">
        <Sidebar />
        <main className="flex-1 md:ml-[72px] pb-[60px] md:pb-0 min-h-screen overflow-x-hidden flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </main>
      </div>
      <BackToTop />
    </div>
  )
}
