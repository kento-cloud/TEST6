"use client"

import { useState } from "react"

const tabs = ["ミッション", "マイル特典", "クイズ"] as const

const streakMilestones = [
  { label: "2週", points: "+300" },
  { label: "4週", points: "+1,000" },
  { label: "8週", points: "+1,800" },
  { label: "12週", points: "+2,200" },
  { label: "16週", points: "+2,600" },
] as const

export default function ActionPage() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-6 md:px-10 py-6 max-w-[960px] w-full mx-auto">
        <h1 className="text-[24px] font-bold mb-6 tracking-[0.1em]">アクション</h1>

        {/* Tabs */}
        <div className="flex border-b border-[#303240] mb-6">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-3 text-[15px] font-bold text-center transition-colors cursor-pointer ${
                i === activeTab ? "text-white border-b-2 border-white -mb-[1px]" : "text-[#606370]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 0 && (
          <div className="flex flex-col gap-3">
            {/* 保有マイル */}
            <div className="gradient-button rounded-xl px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-[12px] text-white/70 mb-1">保有マイル</p>
                <p className="text-[28px] font-bold flex items-center gap-2">
                  <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[11px] font-black" style={{ color: "#cd1cfa" }}>P</span>
                  0
                </p>
              </div>
              <div className="flex items-center gap-1">
                <p className="text-[12px] text-white/70 text-right">動画を視聴完了する毎に<br />+50マイル自動付与</p>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white" fillOpacity="0.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
              </div>
            </div>

            {/* 連続ミッション */}
            <section>
              <h2 className="text-[16px] font-bold mb-3">連続ミッション</h2>
              <div className="bg-[#252738] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold text-[15px]">0週連続視聴</p>
                  <button disabled className="text-[12px] font-bold text-white/50 bg-[#505a67] px-4 py-[6px] rounded-full cursor-not-allowed">受け取る</button>
                </div>
                <div className="flex items-center justify-between">
                  {streakMilestones.map((m) => (
                    <div key={m.label} className="text-center">
                      <p className="text-[13px] text-[#a9abb8]">{m.label}</p>
                      <p className="text-[12px] text-[#606370] mt-1">{m.points}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* デイリーミッション */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[16px] font-bold">デイリーミッション</h2>
                <span className="text-[13px] text-[#a9abb8]">24:00まで</span>
              </div>
              <div className="flex flex-col gap-[2px]">
                <div className="bg-[#252738] rounded-t-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-[15px]">動画を2つ視聴完了する</p>
                    <button disabled className="text-[12px] font-bold text-white/50 bg-[#505a67] px-4 py-[6px] rounded-full cursor-not-allowed">受け取る</button>
                  </div>
                  <div className="flex justify-end text-[13px] text-[#a9abb8] mb-2">0/2</div>
                  <div className="h-[4px] bg-[#383a4e] rounded-full">
                    <div className="h-full w-0 gradient-button rounded-full" />
                  </div>
                  <div className="flex justify-end text-[13px] text-[#a9abb8] mt-1">+40</div>
                </div>
                <div className="bg-[#252738] rounded-b-xl p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-[15px]">エピソードを評価する</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-[#a9abb8]">+10</span>
                      <button disabled className="text-[12px] font-bold text-white/50 bg-[#505a67] px-4 py-[6px] rounded-full cursor-not-allowed">受け取る</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ウィークリーミッション */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[16px] font-bold">ウィークリーミッション</h2>
                <span className="text-[13px] text-[#a9abb8]">日曜24:00まで</span>
              </div>
              <div className="flex flex-col gap-[2px]">
                <div className="bg-[#252738] rounded-t-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-[15px]">動画を視聴完了する</p>
                    <button disabled className="text-[12px] font-bold text-white/50 bg-[#505a67] px-4 py-[6px] rounded-full cursor-not-allowed">受け取る</button>
                  </div>
                  <div className="flex items-center justify-between text-[13px] text-[#a9abb8] mb-2">
                    <span>3</span><span>7</span><span>10</span>
                  </div>
                  <div className="h-[4px] bg-[#383a4e] rounded-full mb-1">
                    <div className="h-full w-0 gradient-button rounded-full" />
                  </div>
                  <div className="flex items-center justify-between text-[12px] text-[#606370]">
                    <span>+30</span><span>+70</span><span>+150</span>
                  </div>
                </div>
                <div className="bg-[#252738] rounded-b-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-[15px]">クイズで正答率100%を達成する</p>
                    <button disabled className="text-[12px] font-bold text-white/50 bg-[#505a67] px-4 py-[6px] rounded-full cursor-not-allowed">受け取る</button>
                  </div>
                  <div className="flex items-center justify-between text-[13px] text-[#a9abb8] mb-2">
                    <span>1</span><span>3</span><span>5</span>
                  </div>
                  <div className="h-[4px] bg-[#383a4e] rounded-full mb-1">
                    <div className="h-full w-0 gradient-button rounded-full" />
                  </div>
                  <div className="flex items-center justify-between text-[12px] text-[#606370]">
                    <span>+30</span><span>+90</span><span>+180</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 初回限定ミッション */}
            <section>
              <h2 className="text-[16px] font-bold mb-3">初回限定ミッション</h2>
              <div className="flex flex-col gap-[2px]">
                {["プレイリストを作成する", "番組をフォローする", "あとで見るを利用する"].map((title, i, arr) => (
                  <div key={title} className={`bg-[#252738] p-5 flex items-center justify-between ${
                    i === 0 ? "rounded-t-xl" : i === arr.length - 1 ? "rounded-b-xl" : ""
                  }`}>
                    <p className="text-[15px]">{title}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-[#a9abb8]">+100</span>
                      <button disabled className="text-[12px] font-bold text-white/50 bg-[#505a67] px-4 py-[6px] rounded-full cursor-not-allowed">受け取る</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <button disabled className="w-full py-4 gradient-button rounded-xl text-[15px] text-white/50 font-bold cursor-not-allowed">
              すべて受け取る
            </button>
          </div>
        )}

        {activeTab === 1 && (
          <div className="flex flex-col items-center py-16">
            <p className="text-[#606370]">マイルを貯めて特典と交換しよう</p>
          </div>
        )}

        {activeTab === 2 && (
          <div className="flex flex-col items-center py-16">
            <p className="text-[#606370]">クイズに挑戦してマイルを獲得しよう</p>
          </div>
        )}
      </div>
    </div>
  )
}
