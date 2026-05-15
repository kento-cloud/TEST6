import { Sidebar } from "@/components/Sidebar"

export default function FrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="bg-[#0e1226] text-white">
      <div className="flex flex-row items-stretch w-full min-h-screen">
        <Sidebar />
        <main className="flex-1 md:ml-[72px] pb-[60px] md:pb-0 min-h-screen animate-gradient overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
