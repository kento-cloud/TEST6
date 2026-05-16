import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ビジネス映像メディア「PIVOT」",
  description:
    "PIVOTは、「日本をPIVOTする」をミッションに掲げるビジネス映像メディアです。",
  icons: {
    icon: "/favicon/favicon.ico",
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
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-['Noto_Sans_JP',sans-serif] m-0 p-0 antialiased">
        {children}
      </body>
    </html>
  )
}
