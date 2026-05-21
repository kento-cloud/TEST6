export default function FrontLoading() {
  return (
    <div className="min-h-screen bg-[#0a1a0f]">
      {/* Header placeholder */}
      <div className="h-14 bg-[#142118] border-b border-[#1a2e22]">
        <div className="max-w-[1400px] mx-auto px-4 h-full flex items-center justify-between">
          <div className="h-6 w-32 bg-[#1a2e22] rounded animate-pulse" />
          <div className="flex gap-4">
            <div className="h-8 w-20 bg-[#1a2e22] rounded animate-pulse" />
            <div className="h-8 w-20 bg-[#1a2e22] rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Tab bar placeholder */}
      <div className="h-10 bg-[#0f1f15] border-b border-[#1a2e22]">
        <div className="max-w-[1400px] mx-auto px-4 flex gap-6 items-center h-full">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 w-16 bg-[#142118] rounded animate-pulse" />
          ))}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-8">
        {/* Featured slider placeholder */}
        <div className="w-full aspect-[16/7] bg-[#142118] rounded-xl animate-pulse mb-10" />

        {/* Section title placeholder */}
        <div className="h-6 w-40 bg-[#142118] rounded animate-pulse mb-5" />

        {/* Card grid placeholder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden">
              <div className="aspect-video bg-[#142118] rounded-lg animate-pulse" />
              <div className="pt-3 space-y-2">
                <div className="h-4 w-3/4 bg-[#142118] rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-[#142118] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Second section */}
        <div className="h-6 w-36 bg-[#142118] rounded animate-pulse mb-5 mt-10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden">
              <div className="aspect-video bg-[#142118] rounded-lg animate-pulse" />
              <div className="pt-3 space-y-2">
                <div className="h-4 w-3/4 bg-[#142118] rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-[#142118] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
