const STEP_LABELS: Record<string, string> = {
  transcribing: "文字起こし中",
  extracting_audio: "音声抽出中",
  generating: "AI生成中",
  generating_summary: "要約生成中",
  generating_chapters: "チャプター生成中",
  generating_article: "記事生成中",
  generating_tags: "タグ生成中",
  generating_thumbnail: "サムネイル生成中",
}

const PUBLISH_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  review: "bg-orange-100 text-orange-700",
  published: "bg-green-100 text-green-700",
  unpublished: "bg-gray-100 text-gray-600",
}

const PUBLISH_LABELS: Record<string, string> = {
  draft: "下書き",
  review: "レビュー待ち",
  published: "公開中",
  unpublished: "非公開",
}

interface Props {
  readonly publishStatus: string
  readonly processingStep: string
}

export function StatusBadge({ publishStatus, processingStep }: Props) {
  if (processingStep === "error") {
    return <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-red-100 text-red-700">エラー</span>
  }
  if (processingStep !== "none") {
    return (
      <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-yellow-100 text-yellow-700">
        {STEP_LABELS[processingStep] ?? "処理中"}
      </span>
    )
  }
  return (
    <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${PUBLISH_STYLES[publishStatus] ?? PUBLISH_STYLES.draft}`}>
      {PUBLISH_LABELS[publishStatus] ?? publishStatus}
    </span>
  )
}

/** getStatusDisplay for server components that need label + style separately */
export function getStatusDisplay(publishStatus: string | null, processingStep: string | null): { label: string; style: string } {
  const step = processingStep ?? "none"
  if (step === "error") return { label: "エラー", style: "bg-red-100 text-red-700" }
  if (step !== "none") return { label: STEP_LABELS[step] ?? "処理中", style: "bg-yellow-100 text-yellow-700" }
  const ps = publishStatus ?? "draft"
  return {
    label: PUBLISH_LABELS[ps] ?? ps,
    style: PUBLISH_STYLES[ps] ?? PUBLISH_STYLES.draft,
  }
}
