"use client"

type ContentMode = "video" | "audio" | "article"

interface ContentModeTabProps {
  readonly activeMode: ContentMode
  readonly onModeChange: (mode: ContentMode) => void
  readonly hasAudio: boolean
  readonly hasArticle: boolean
}

const TABS: { mode: ContentMode; label: string; icon: React.ReactNode }[] = [
  {
    mode: "video",
    label: "動画",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM10 8l6 4-6 4V8z" />
      </svg>
    ),
  },
  {
    mode: "audio",
    label: "音声",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6zm-2 16c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
      </svg>
    ),
  },
  {
    mode: "article",
    label: "記事",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm2-6h8v2H8v-2zm0-3h8v2H8v-2z" />
      </svg>
    ),
  },
]

export function ContentModeTab({ activeMode, onModeChange, hasAudio, hasArticle }: ContentModeTabProps) {
  function isDisabled(mode: ContentMode): boolean {
    if (mode === "audio") return !hasAudio
    if (mode === "article") return !hasArticle
    return false
  }

  return (
    <div className="flex bg-[#1d2030] rounded-xl p-1 mb-6">
      {TABS.map(({ mode, label, icon }) => {
        const disabled = isDisabled(mode)
        const active = activeMode === mode

        return (
          <button
            key={mode}
            onClick={() => !disabled && onModeChange(mode)}
            disabled={disabled}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[13px] font-bold transition-all cursor-pointer
              ${active
                ? "bg-[#16a34a] text-white shadow-lg"
                : disabled
                  ? "text-[#606370] cursor-not-allowed opacity-50"
                  : "text-[#a9abb8] hover:text-white hover:bg-[#303240]"
              }`}
          >
            {icon}
            {label}
          </button>
        )
      })}
    </div>
  )
}

export type { ContentMode }
