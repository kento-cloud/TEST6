import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-8">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-[#a9abb8] hover:text-white mb-6"
      >
        ← 戻る
      </Link>

      <h1 className="text-2xl font-bold text-white mb-8">お問い合わせ</h1>

      <form className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm text-[#a9abb8] mb-2"
          >
            お名前
          </label>
          <input
            id="name"
            type="text"
            placeholder="山田 太郎"
            className="w-full bg-[#1d2030] border border-[#606370] rounded-lg px-4 py-3 text-sm text-white placeholder-[#606370] focus:outline-none focus:border-[#cd1cfa]"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm text-[#a9abb8] mb-2"
          >
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            placeholder="example@email.com"
            className="w-full bg-[#1d2030] border border-[#606370] rounded-lg px-4 py-3 text-sm text-white placeholder-[#606370] focus:outline-none focus:border-[#cd1cfa]"
          />
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm text-[#a9abb8] mb-2"
          >
            お問い合わせ内容
          </label>
          <textarea
            id="message"
            rows={6}
            placeholder="お問い合わせ内容をご入力ください"
            className="w-full bg-[#1d2030] border border-[#606370] rounded-lg px-4 py-3 text-sm text-white placeholder-[#606370] focus:outline-none focus:border-[#cd1cfa] resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-lg text-sm font-medium text-white"
          style={{
            background: "linear-gradient(90deg, #cd1cfa, #1e82be)",
          }}
        >
          送信する
        </button>
      </form>
    </div>
  );
}
