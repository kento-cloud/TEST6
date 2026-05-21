import Link from "next/link";

const rows = [
  { label: "事業者名", value: "株式会社PADDOCK" },
  { label: "代表者", value: "非公開" },
  { label: "所在地", value: "東京都" },
  { label: "電話番号", value: "お問い合わせはメールにて受付" },
  { label: "メールアドレス", value: "support@paddock.jp" },
  { label: "サービスURL", value: "https://paddock.jp/" },
  {
    label: "販売価格",
    value:
      "各サービスページに表示された価格に準じます。表示価格はすべて税込みです。",
  },
  {
    label: "支払方法",
    value: "クレジットカード決済、Apple ID決済、Google Play決済",
  },
  {
    label: "支払時期",
    value:
      "クレジットカード決済の場合、ご利用のクレジットカード会社の規定に基づくお支払いとなります。",
  },
  {
    label: "サービス提供時期",
    value:
      "お支払い手続き完了後、直ちにご利用いただけます。",
  },
  {
    label: "返品・キャンセル",
    value:
      "デジタルコンテンツの性質上、購入後の返品・キャンセルはお受けしておりません。ただし、法令に基づく場合はこの限りではありません。",
  },
  {
    label: "動作環境",
    value:
      "最新版のChrome、Safari、Firefox、Edge。iOS 15以降、Android 10以降。",
  },
] as const;

export default function AsctPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-8">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-[#a9abb8] hover:text-white mb-6"
      >
        ← 戻る
      </Link>

      <h1 className="text-2xl font-bold text-white mb-8">
        特定商取引法に基づく表記
      </h1>

      <div className="border border-[#606370] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row) => (
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
    </div>
  );
}
