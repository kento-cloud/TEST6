import Link from "next/link";

const companyInfo = [
  { label: "会社名", value: "株式会社PADDOCK" },
  { label: "英文社名", value: "PADDOCK Inc." },
  { label: "設立", value: "2024年" },
  { label: "代表取締役", value: "非公開" },
  {
    label: "事業内容",
    value:
      "競馬情報メディア「PADDOCK」の企画・開発・運営",
  },
  { label: "所在地", value: "東京都" },
  { label: "資本金", value: "非公開" },
  { label: "従業員数", value: "非公開" },
  { label: "URL", value: "https://paddock.jp/" },
  { label: "お問い合わせ", value: "support@paddock.jp" },
] as const;

export default function CompanyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-8">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-[#a9abb8] hover:text-white mb-6"
      >
        ← 戻る
      </Link>

      <h1 className="text-2xl font-bold text-white mb-8">運営会社</h1>

      <div className="border border-[#606370] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {companyInfo.map((row) => (
              <tr
                key={row.label}
                className="border-b border-[#606370] last:border-b-0"
              >
                <th className="text-left text-[#a9abb8] font-medium bg-[#1d2030] px-5 py-4 w-[140px] md:w-[180px] align-top whitespace-nowrap">
                  {row.label}
                </th>
                <td className="text-white px-5 py-4">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 text-sm text-[#a9abb8] leading-relaxed">
        <h2 className="text-base font-bold text-white mb-3">PADDOCKについて</h2>
        <p>
          PADDOCKは、競馬をもっと深く楽しむための映像メディアです。レース分析、血統解説、調教師・騎手インタビューなど、競馬の深い世界を高品質な映像コンテンツとしてお届けしています。
        </p>
        <p className="mt-3">
          「データと映像で、競馬をもっと楽しく。」をミッションに掲げ、動画・音声・記事の3つのモードでコンテンツを多角的に楽しめるプラットフォームを提供しています。
        </p>
      </div>
    </div>
  );
}
