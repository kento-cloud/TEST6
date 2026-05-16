import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-8">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-[#a9abb8] hover:text-white mb-6"
      >
        ← 戻る
      </Link>

      <h1 className="text-2xl font-bold text-white mb-8">
        プライバシーポリシー
      </h1>

      <div className="text-sm text-[#a9abb8] leading-relaxed space-y-6">
        <p>
          株式会社PIVOT（以下「当社」といいます）は、当社が提供するサービス「PIVOT」（以下「本サービス」といいます）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
        </p>

        <section>
          <h2 className="text-base font-bold text-white mb-3">
            1. 収集する情報
          </h2>
          <p>当社は、本サービスの提供にあたり、以下の情報を収集することがあります。</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>氏名、メールアドレス等のアカウント情報</li>
            <li>本サービスの利用履歴（視聴履歴、検索履歴、お気に入り等）</li>
            <li>端末情報（OS、ブラウザの種類、端末識別子等）</li>
            <li>IPアドレス、Cookie情報、アクセスログ</li>
            <li>決済に関する情報（有料サービス利用時）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-3">
            2. 利用目的
          </h2>
          <p>当社は、収集した情報を以下の目的で利用します。</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>本サービスの提供、維持、改善</li>
            <li>ユーザーへのお知らせ、サポート対応</li>
            <li>利用状況の分析、統計データの作成</li>
            <li>パーソナライズされたコンテンツの推薦</li>
            <li>不正利用の防止、セキュリティの確保</li>
            <li>広告の配信および効果測定</li>
            <li>新サービスの開発・企画</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-3">
            3. 第三者への提供
          </h2>
          <p>
            当社は、以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません。
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>ユーザーの同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
            <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
            <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-3">
            4. Cookieの使用
          </h2>
          <p>
            当社は、本サービスにおいてCookieおよび類似の技術を使用しています。Cookieは、ユーザーのブラウザに保存される小さなデータファイルであり、本サービスの利便性向上、アクセス解析、広告配信等の目的で使用されます。ユーザーは、ブラウザの設定によりCookieの受け入れを拒否することができますが、その場合、本サービスの一部機能が利用できなくなる場合があります。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-3">
            5. 安全管理措置
          </h2>
          <p>
            当社は、個人情報の漏洩、滅失またはき損の防止その他の個人情報の安全管理のために必要かつ適切な措置を講じます。また、個人情報を取り扱う従業者及び委託先に対して、必要かつ適切な監督を行います。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-3">
            6. 個人情報の開示・訂正・削除
          </h2>
          <p>
            ユーザーは、当社に対して、自己の個人情報の開示、訂正、追加、削除、利用停止または第三者への提供の停止を請求することができます。請求を受けた場合、当社は合理的な範囲で速やかに対応いたします。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-3">
            7. お問い合わせ窓口
          </h2>
          <p>
            本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。
          </p>
          <p className="mt-2">
            株式会社PIVOT 個人情報保護担当
            <br />
            メール: privacy@pivot.inc
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-3">
            8. プライバシーポリシーの変更
          </h2>
          <p>
            当社は、必要に応じて本ポリシーを変更することがあります。変更後のプライバシーポリシーは、本サービス上に掲載した時点から効力を生じるものとします。重要な変更がある場合には、本サービス上で通知いたします。
          </p>
        </section>

        <p className="pt-4 text-xs text-[#606370]">
          制定日: 2023年1月1日 / 最終改定日: 2024年4月1日
        </p>
      </div>
    </div>
  );
}
