import Link from "next/link";

const companyInfo = [
  { label: "会社名", value: "株式会社PIVOT" },
  { label: "英文社名", value: "PIVOT Inc." },
  { label: "設立", value: "2021年8月" },
  { label: "代表取締役", value: "佐々木 紀彦" },
  {
    label: "事業内容",
    value:
      "ビジネス映像メディア「PIVOT」の企画・開発・運営",
  },
  { label: "所在地", value: "〒107-0062 東京都港区南青山3丁目1番36号" },
  { label: "資本金", value: "非公開" },
  { label: "従業員数", value: "非公開" },
  { label: "URL", value: "https://pivotmedia.co.jp/" },
  { label: "お問い合わせ", value: "support@pivot.inc" },
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
        <h2 className="text-base font-bold text-white mb-3">PIVOTについて</h2>
        <p>
          PIVOTは、ビジネスパーソンの学びと発見を加速するビジネス映像メディアです。経営者、起業家、クリエイター、学者など、各分野の第一線で活躍するリーダーたちの知見やストーリーを、高品質な映像コンテンツとしてお届けしています。
        </p>
        <p className="mt-3">
          「学びのきっかけを、すべての人に。」をミッションに掲げ、ビジネス、テクノロジー、キャリア、マネー、ライフスタイルなど多様なジャンルのコンテンツを無料で提供しています。
        </p>
      </div>
    </div>
  );
}
