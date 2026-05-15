import Link from "next/link";

export default function AccountSettingPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-8">
      <Link
        href="/account"
        className="inline-flex items-center text-sm text-[#a9abb8] hover:text-white mb-6"
      >
        ← 戻る
      </Link>

      <h1 className="text-2xl font-bold text-white mb-8">アカウント設定</h1>

      <div className="space-y-6">
        <div className="border border-[#606370] rounded-lg p-5">
          <label className="block text-sm text-[#a9abb8] mb-2">
            メールアドレス
          </label>
          <p className="text-white bg-[#1d2030] rounded px-4 py-3 text-sm">
            未設定
          </p>
        </div>

        <div className="border border-[#606370] rounded-lg p-5">
          <label className="block text-sm text-[#a9abb8] mb-2">
            ニックネーム
          </label>
          <p className="text-white bg-[#1d2030] rounded px-4 py-3 text-sm">
            未設定
          </p>
        </div>

        <div className="pt-4">
          <button className="w-full border border-red-500 text-red-500 rounded-lg py-3 text-sm font-medium hover:bg-red-500/10 transition-colors">
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}
