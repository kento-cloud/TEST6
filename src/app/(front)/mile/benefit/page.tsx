import Link from "next/link";

export default function MileBenefitPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-8">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-[#a9abb8] hover:text-white mb-6"
      >
        ← 戻る
      </Link>

      <h1 className="text-2xl font-bold text-white mb-8">パドP特典</h1>

      <div className="border border-[#5e6e63] rounded-lg p-6 mb-8">
        <p className="text-sm text-[#a9abb8] mb-1">保有パドP</p>
        <p className="text-3xl font-bold text-white">
          0
          <span className="text-base font-normal text-[#a9abb8] ml-1">
            パドP
          </span>
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4 opacity-20">🎁</div>
        <p className="text-[#a9abb8] text-sm">
          パドPを貯めて特典と交換しよう
        </p>
      </div>
    </div>
  );
}
