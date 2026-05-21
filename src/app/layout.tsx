import type { Metadata } from "next"
import { AuthProvider } from "@/contexts/AuthContext"
import "./globals.css"

export const metadata: Metadata = {
  title: "競馬情報メディア「PADDOCK」",
  description:
    "PADDOCKは、競馬をもっと深く楽しむための映像メディアです。",
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "競馬情報メディア「PADDOCK」",
    description: "PADDOCKは、競馬をもっと深く楽しむための映像メディアです。",
    images: [
      {
        url: "/images/ogp-default.svg",
        width: 1200,
        height: 630,
        alt: "PADDOCK - 競馬を、もっと深く。",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "競馬情報メディア「PADDOCK」",
    description: "PADDOCKは、競馬をもっと深く楽しむための映像メディアです。",
    images: ["/images/ogp-default.svg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-['Noto_Sans_JP',sans-serif] m-0 p-0 antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
