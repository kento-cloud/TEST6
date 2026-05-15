import Link from "next/link"

const menuItems = [
  { label: "アカウント設定", href: "/account/setting" },
  { label: "特典交換", href: "/mile/benefit" },
] as const

const infoItems = [
  { label: "お問い合わせ", href: "/contact" },
  { label: "利用規約", href: "/terms" },
  { label: "プライバシーポリシー", href: "/privacy" },
  { label: "特定商取引法に基づく表記", href: "/asct" },
  { label: "運営会社情報", href: "/company" },
] as const

function PivotLogoFull() {
  return (
    <Link href="/" className="inline-block">
      <svg width="100" height="24" viewBox="0 0 100 24" fill="none">
        <text x="0" y="20" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="24">
          <tspan fill="#cd1cfa">PI</tspan>
          <tspan fill="url(#accGrad)">V</tspan>
          <tspan fill="#1e82be">OT</tspan>
        </text>
        <defs>
          <linearGradient id="accGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#cd1cfa" />
            <stop offset="100%" stopColor="#1e82be" />
          </linearGradient>
        </defs>
      </svg>
    </Link>
  )
}

export default function AccountPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-6 pt-6 pb-2">
        <PivotLogoFull />
      </div>

      <div className="flex-1 flex items-start justify-center px-4 pt-8 pb-16">
        <div className="w-full max-w-[480px] bg-[#181a2e] rounded-2xl p-6 md:p-8 border border-[#303240]/50">
          <h1 className="text-[22px] font-bold text-center mb-8">アカウント</h1>

          <div className="flex flex-col gap-4 mb-8">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-5 h-[48px] bg-[#303240]/60 rounded-lg hover:bg-[#303240] transition-colors"
              >
                <span className="text-[15px]">{item.label}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#606370"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
              </Link>
            ))}
          </div>

          <div className="flex flex-col">
            {infoItems.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-5 h-[48px] hover:bg-[#303240]/20 transition-colors ${
                  i < infoItems.length - 1 ? "border-b border-[#303240]/50" : ""
                }`}
              >
                <span className="text-[15px]">{item.label}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#606370"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
