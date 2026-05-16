import Link from "next/link"

interface SectionHeaderProps {
  readonly title: string
  readonly spTitle?: string
  readonly href?: string
  readonly linkText?: string
  readonly id?: string
}

export function SectionHeader({ title, spTitle, href, linkText = "すべて表示", id }: SectionHeaderProps) {
  const headingId = id ?? `section-${title.replace(/\s+/g, "-")}`

  return (
    <div className="flex items-center justify-between mb-3 md:mb-4">
      <h2 id={headingId} className="text-[18px] md:text-[24px] font-bold text-white">
        {spTitle ? (
          <>
            <span className="md:hidden">{spTitle}</span>
            <span className="hidden md:inline">{title}</span>
          </>
        ) : (
          title
        )}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-[13px] md:text-[14px] text-[#999] hover:text-white transition-colors shrink-0"
        >
          {linkText} &gt;
        </Link>
      )}
    </div>
  )
}
