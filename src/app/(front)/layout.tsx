import { Sidebar } from "@/components/Sidebar"
import { Footer } from "@/components/Footer"
import { BackToTop } from "@/components/BackToTop"
import { NodeBackground } from "@/components/NodeBackground"

export default function FrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="relative bg-[#060f0a] text-white">
      {/* 背景: 六角形ノードのネットワーク（NODE風・装飾レイヤー） */}
      <NodeBackground />
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
