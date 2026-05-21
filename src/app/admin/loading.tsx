export default function AdminLoading() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar placeholder */}
      <div className="hidden md:block w-[240px] bg-white border-r border-gray-100 p-4 shrink-0">
        <div className="h-8 w-28 bg-gray-100 rounded animate-pulse mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 p-4 md:p-8">
        {/* Page title */}
        <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-6" />

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="h-3 w-16 bg-gray-100 rounded animate-pulse mb-2" />
              <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Table placeholder */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Table header */}
          <div className="flex gap-4 px-5 py-3 border-b border-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
          {/* Table rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-5 py-4 border-b border-gray-50">
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
