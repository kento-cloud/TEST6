import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-8">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-[#a9abb8] hover:text-white mb-6"
      >
        ← 戻る
      </Link>

      <h1 className="text-2xl font-bold text-white mb-8">利用規約</h1>

      <div className="text-sm text-[#a9abb8] leading-relaxed space-y-6">
        <section>
          <h2 className="text-base font-bold text-white mb-3">第1条（適用）</h2>
          <p>
            本規約は、株式会社AI MEDIA（以下「当社」といいます）が提供するAI MEDIAサービス（以下「本サービス」といいます）の利用に関する条件を、本サービスを利用するすべてのユーザー（以下「ユーザー」といいます）と当社との間で定めるものです。ユーザーは、本規約に同意の上、本サービスを利用するものとします。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-3">第2条（定義）</h2>
          <p>
            本規約において使用する用語の定義は以下の通りとします。
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>「本サービス」とは、当社が運営するAI教養メディア「AI MEDIA」を指します。</li>
            <li>「コンテンツ」とは、本サービス上で提供される動画、テキスト、画像その他一切の情報を指します。</li>
            <li>「ユーザー」とは、本サービスを利用するすべての個人または法人を指します。</li>
            <li>「会員」とは、本サービスにアカウント登録を行ったユーザーを指します。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-3">第3条（アカウント登録）</h2>
          <p>
            本サービスの一部機能を利用するためには、当社所定の方法によりアカウント登録を行う必要があります。ユーザーは、登録情報について正確かつ最新の情報を提供するものとし、登録情報に変更があった場合には速やかに更新するものとします。アカウントの管理はユーザー自身の責任において行うものとし、第三者による不正利用について当社は一切の責任を負いません。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-3">第4条（禁止事項）</h2>
          <p>ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>当社のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
            <li>当社のサービスの運営を妨害するおそれのある行為</li>
            <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
            <li>他のユーザーに成りすます行為</li>
            <li>当社のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
            <li>コンテンツの無断転載、複製、配布、改変等の行為</li>
            <li>その他、当社が不適切と判断する行為</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-3">第5条（コンテンツの知的財産権）</h2>
          <p>
            本サービスにおいて提供されるコンテンツに関する著作権その他の知的財産権は、当社または当社にその利用を許諾した権利者に帰属します。ユーザーは、当社の事前の書面による承諾なく、コンテンツを複製、転載、改変、販売、出版その他の二次利用をすることはできません。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-3">第6条（サービスの変更・中断・終了）</h2>
          <p>
            当社は、ユーザーに事前に通知することなく、本サービスの内容を変更し、または本サービスの提供を中断もしくは終了することができるものとします。当社は、これによってユーザーに生じた損害について一切の責任を負いません。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-3">第7条（免責事項）</h2>
          <p>
            当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます）がないことを保証するものではありません。当社は、ユーザーに対して、かかる瑕疵を除去して本サービスを提供する義務を負いません。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-3">第8条（準拠法・裁判管轄）</h2>
          <p>
            本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </section>

        <p className="pt-4 text-xs text-[#606370]">
          制定日: 2023年1月1日 / 最終改定日: 2024年4月1日
        </p>
      </div>
    </div>
  );
}
