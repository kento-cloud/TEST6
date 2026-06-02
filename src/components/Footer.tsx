import Link from "next/link"

const footerLinks = [
  { label: "利用規約", href: "/terms" },
  { label: "プライバシーポリシー", href: "/privacy" },
  { label: "特定商取引法", href: "/asct" },
  { label: "運営会社", href: "/company" },
  { label: "お問い合わせ", href: "/contact" },
] as const

export function Footer() {
  return (
    <footer className="border-t border-[#303240]/50 mt-auto">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
        <div className="flex justify-center mb-6">
          <img src="/assets/logo/paddock_logo.svg" alt="AI MEDIA" className="h-[28px]" />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-4">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[12px] text-[#606370] hover:text-[#a9abb8] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <p className="text-center text-[11px] text-[#606370]">
          &copy; {new Date().getFullYear()} AI MEDIA Inc. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
