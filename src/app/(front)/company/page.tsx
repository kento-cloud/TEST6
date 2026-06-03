import Link from "next/link";

const companyInfo = [
  { label: "会社名", value: "株式会社AI MEDIA" },
  { label: "英文社名", value: "AI MEDIA Inc." },
  { label: "設立", value: "2024年" },
  { label: "代表取締役", value: "非公開" },
  {
    label: "事業内容",
    value:
      "AI教養メディア「AI MEDIA」の企画・開発・運営",
  },
  { label: "所在地", value: "東京都" },
  { label: "資本金", value: "非公開" },
  { label: "従業員数", value: "非公開" },
  { label: "URL", value: "https://aimedia.jp/" },
  { label: "お問い合わせ", value: "support@aimedia.jp" },
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

      <div className="border border-[#5e6e63] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {companyInfo.map((row) => (
              <tr
                key={row.label}
                className="border-b border-[#5e6e63] last:border-b-0"
              >
                <th className="text-left text-[#a9abb8] font-medium bg-[#15271c] px-5 py-4 w-[140px] md:w-[180px] align-top whitespace-nowrap">
                  {row.label}
                </th>
                <td className="text-white px-5 py-4">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 text-sm text-[#a9abb8] leading-relaxed">
        <h2 className="text-base font-bold text-white mb-3">AI MEDIAについて</h2>
        <p>
          AI MEDIAは、AIをもっと深く理解するための映像メディアです。生成AIの最新動向、技術のしくみ解説、ビジネス活用事例、AIが社会にもたらす変化まで、AIの世界を高品質な映像コンテンツとしてお届けしています。
        </p>
        <p className="mt-3">
          「AIを、すべての人の教養に。」をミッションに掲げ、動画・音声・記事の3つのモードでコンテンツを多角的に学べるプラットフォームを提供しています。
        </p>
      </div>
    </div>
  );
}
