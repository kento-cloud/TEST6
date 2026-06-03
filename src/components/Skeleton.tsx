export function SkeletonCard() {
  return (
    <div className="shrink-0 w-[calc(50%-5px)] md:w-[calc(16.666%-8.33px)] animate-pulse">
      <div className="w-full aspect-[1029/540] rounded-[1vw] md:rounded-[0.5vw] bg-[#15271c]" />
      <div className="mt-2 space-y-1.5">
        <div className="h-3 bg-[#15271c] rounded w-[90%]" />
        <div className="h-3 bg-[#15271c] rounded w-[60%]" />
      </div>
    </div>
  )
}

export function SkeletonFeatured() {
  return (
    <div className="w-full aspect-video bg-[#15271c] animate-pulse" />
  )
}
