import type { Episode } from "@/types"

/**
 * エピソードIDからサムネイルパスを生成
 * 存在するIDのみ使用すること
 */
function thumb(id: number): string {
  return `/images/static/converted/chapter/${id}/ogp/${id}.webp`
}

/** 新着エピソード（存在する画像IDのみ使用） */
export const newEpisodes: readonly Episode[] = [
  {
    id: "14365",
    title: "宇宙開発の課題 \"交通整備\"は誰がする？",
    programName: "PIVOT TALK SCIENCE",
    duration: "20:04",
    viewCount: "1.2万回視聴",
    publishedAt: "1日前",
    thumbnailUrl: thumb(14365),
    commentCount: 0,
    rating: 4.5,
    description: "宇宙ビジネスは、ロケットや衛星だけでは成り立たない。",
    categoryCode: "technology",
  },
  {
    id: "14328",
    title: "100年に一度の変化。次世代タバコでJTは勝てるのか？【筒井岳彦社長】",
    programName: "TOP TALK",
    duration: "28:29",
    viewCount: "3.8万回視聴",
    publishedAt: "2日前",
    thumbnailUrl: thumb(14328),
    commentCount: 2,
    rating: 4.3,
    description: "5年で株価を3倍に伸ばすなど、海外市場での成長が続くJT。",
    categoryCode: "business",
  },
  {
    id: "14325",
    title: "「山下本気うどん」売却までの経緯【オモロー山下】",
    programName: "MONEY SKILL SET",
    duration: "38:42",
    viewCount: "7.4万回視聴",
    publishedAt: "2日前",
    thumbnailUrl: thumb(14325),
    commentCount: 7,
    rating: 4.5,
    description: "借金1000万円から資産を築いた芸人が語る売却の全貌。",
    categoryCode: "money",
  },
  {
    id: "14287",
    title: "【宇宙のミステリー】人体に起きる「謎の症状」",
    programName: "EXTREME SCIENCE",
    duration: "20:43",
    viewCount: "2.1万回視聴",
    publishedAt: "2日前",
    thumbnailUrl: thumb(14287),
    commentCount: 1,
    rating: 4.7,
    description: "宇宙への移住が実現に近づく中、人体に生じる謎の症状。",
    categoryCode: "technology",
  },
  {
    id: "14317",
    title: "Geminiで学ぶ・稼ぐ術／NotebookLMによるAI家庭教師／穴場の稼ぎ方",
    programName: "ランキング超分析",
    duration: "32:12",
    viewCount: "8.3万回視聴",
    publishedAt: "3日前",
    thumbnailUrl: thumb(14317),
    commentCount: 8,
    rating: 4.8,
    description: "気になるテーマのランキングを専門家と共に徹底分析。",
    categoryCode: "technology",
  },
  {
    id: "14305",
    title: "北朝鮮・迎撃不可能なドローン攻撃の恐怖",
    programName: "9 questions",
    duration: "26:58",
    viewCount: "6.7万回視聴",
    publishedAt: "3日前",
    thumbnailUrl: thumb(14305),
    commentCount: 4,
    rating: 4.2,
    description: "北朝鮮は「抑止」から「実行」可能な現実の脅威へ。",
    categoryCode: "global",
  },
  {
    id: "14364",
    title: "新たなヒットの方程式。アニメ×バイラル＝グローバル",
    programName: "PIVOT TALK",
    duration: "23:36",
    viewCount: "1.8万回視聴",
    publishedAt: "4日前",
    thumbnailUrl: thumb(14364),
    commentCount: 2,
    rating: 4.1,
    description: "J-POPが復権している。新たなヒットの法則とは何か？",
    categoryCode: "business",
  },
  {
    id: "14316",
    title: "【コピペで使える】企画を成功に導く最強AI壁打ち",
    programName: "ビジネス虎の巻",
    duration: "27:45",
    viewCount: "3.2万回視聴",
    publishedAt: "4日前",
    thumbnailUrl: thumb(14316),
    commentCount: 6,
    rating: 4.5,
    description: "AIを味方につける最強企画術を解説。",
    categoryCode: "business",
  },
  {
    id: "14362",
    title: "資産が残る街と消える街【のらえもん】",
    programName: "MONEY SKILL SET",
    duration: "30:09",
    viewCount: "4.1万回視聴",
    publishedAt: "4日前",
    thumbnailUrl: thumb(14362),
    commentCount: 3,
    rating: 4.3,
    description: "人口動態・金利から読み解くマンション市場の構造。",
    categoryCode: "money",
  },
  {
    id: "14357",
    title: "少子化対策は全く効かない。シンガポール・韓国の教訓",
    programName: "9 questions",
    duration: "55:49",
    viewCount: "5.5万回視聴",
    publishedAt: "5日前",
    thumbnailUrl: thumb(14357),
    commentCount: 12,
    rating: 4.4,
    description: "シンガポール・韓国の失敗から学ぶ少子化の真実。",
    categoryCode: "global",
  },
] as const

/** ランキングデータ */
export const rankings: readonly {
  readonly label: string
  readonly key: string
  readonly episodes: readonly Episode[]
}[] = [
  {
    label: "総合",
    key: "overall",
    episodes: [
      {
        id: "14317",
        title: "Geminiで学ぶ・稼ぐ術／AI家庭教師／穴場の稼ぎ方",
        programName: "ランキング超分析",
        duration: "32:12",
        viewCount: "8.3万回視聴",
        publishedAt: "3日前",
        thumbnailUrl: thumb(14317),
        commentCount: 8, rating: 4.8, description: "",
      },
      {
        id: "12600",
        title: "言語化できる人できない人",
        programName: "PIVOT TALK",
        duration: "37:33",
        viewCount: "12万回視聴",
        publishedAt: "3か月前",
        thumbnailUrl: thumb(12600),
        commentCount: 15, rating: 4.7, description: "",
      },
      {
        id: "14305",
        title: "北朝鮮・迎撃不可能なドローン攻撃の恐怖",
        programName: "9 questions",
        duration: "26:58",
        viewCount: "6.7万回視聴",
        publishedAt: "3日前",
        thumbnailUrl: thumb(14305),
        commentCount: 4, rating: 4.2, description: "",
      },
      {
        id: "14325",
        title: "「山下本気うどん」売却までの経緯【オモロー山下】",
        programName: "MONEY SKILL SET",
        duration: "38:42",
        viewCount: "7.4万回視聴",
        publishedAt: "5日前",
        thumbnailUrl: thumb(14325),
        commentCount: 7, rating: 4.5, description: "",
      },
    ],
  },
  {
    label: "月間",
    key: "monthly",
    episodes: [
      {
        id: "14293",
        title: "人生が変わる【先延ばしグセをなくす技術】",
        programName: "BODY SKILL SET",
        duration: "39:48",
        viewCount: "9.1万回視聴",
        publishedAt: "2週間前",
        thumbnailUrl: thumb(14293),
        commentCount: 10, rating: 4.6, description: "",
      },
      {
        id: "14328",
        title: "100年に一度の変化。次世代タバコでJTは勝てるのか？",
        programName: "TOP TALK",
        duration: "28:29",
        viewCount: "3.8万回視聴",
        publishedAt: "2日前",
        thumbnailUrl: thumb(14328),
        commentCount: 2, rating: 4.3, description: "",
      },
      {
        id: "14317",
        title: "Geminiで学ぶ・稼ぐ術／AI家庭教師／穴場の稼ぎ方",
        programName: "ランキング超分析",
        duration: "32:12",
        viewCount: "8.3万回視聴",
        publishedAt: "3日前",
        thumbnailUrl: thumb(14317),
        commentCount: 8, rating: 4.8, description: "",
      },
      {
        id: "14362",
        title: "資産が残る街と消える街【のらえもん】",
        programName: "MONEY SKILL SET",
        duration: "30:09",
        viewCount: "4.1万回視聴",
        publishedAt: "4日前",
        thumbnailUrl: thumb(14362),
        commentCount: 3, rating: 4.3, description: "",
      },
    ],
  },
  {
    label: "週間",
    key: "weekly",
    episodes: [
      {
        id: "14325",
        title: "「山下本気うどん」売却までの経緯【オモロー山下】",
        programName: "MONEY SKILL SET",
        duration: "38:42",
        viewCount: "7.4万回視聴",
        publishedAt: "5日前",
        thumbnailUrl: thumb(14325),
        commentCount: 7, rating: 4.5, description: "",
      },
      {
        id: "14357",
        title: "少子化対策は全く効かない。シンガポール・韓国の教訓",
        programName: "9 questions",
        duration: "55:49",
        viewCount: "5.5万回視聴",
        publishedAt: "5日前",
        thumbnailUrl: thumb(14357),
        commentCount: 12, rating: 4.4, description: "",
      },
      {
        id: "14305",
        title: "北朝鮮・迎撃不可能なドローン攻撃の恐怖",
        programName: "9 questions",
        duration: "26:58",
        viewCount: "6.7万回視聴",
        publishedAt: "3日前",
        thumbnailUrl: thumb(14305),
        commentCount: 4, rating: 4.2, description: "",
      },
      {
        id: "14363",
        title: "イラン情勢の真実。世界はこう変わる",
        programName: "PIVOT GLOBAL",
        duration: "24:15",
        viewCount: "3.8万回視聴",
        publishedAt: "4日前",
        thumbnailUrl: thumb(14363),
        commentCount: 5, rating: 4.3, description: "",
      },
    ],
  },
] as const

/** カテゴリ別フィーチャード（各カテゴリで異なる動画を表示） */
export const categoryFeatured: Record<string, {
  readonly episodes: readonly Episode[]
  readonly programLogos: readonly string[]
}> = {
  business: {
    episodes: [newEpisodes[1], newEpisodes[7], newEpisodes[4]],
    programLogos: [
      "/images/programs/logo_banner/68b86024e30ae.svg",
      "/images/programs/logo_banner/6789c5483cb7d.svg",
      "/images/programs/logo_banner/68baf2526844c.svg",
    ],
  },
  money: {
    episodes: [newEpisodes[2], newEpisodes[8], newEpisodes[1]],
    programLogos: [
      "/images/programs/logo_banner/688dc66289db3.svg",
      "/images/programs/logo_banner/688dc66289db3.svg",
      "/images/programs/logo_banner/68b86024e30ae.svg",
    ],
  },
  career: {
    episodes: [newEpisodes[7], newEpisodes[1], newEpisodes[6]],
    programLogos: [
      "/images/programs/logo_banner/68baf2526844c.svg",
      "/images/programs/logo_banner/68b86024e30ae.svg",
      "/images/programs/logo_banner/6789c5483cb7d.svg",
    ],
  },
  life: {
    episodes: [newEpisodes[3], newEpisodes[7], newEpisodes[8]],
    programLogos: [
      "/images/programs/logo_banner/68f89a4e14742.svg",
      "/images/programs/logo_banner/68baf2526844c.svg",
      "/images/programs/logo_banner/688dc66289db3.svg",
    ],
  },
  technology: {
    episodes: [newEpisodes[0], newEpisodes[4], newEpisodes[3]],
    programLogos: [
      "/images/programs/logo_banner/68f892ba65fed.svg",
      "/images/programs/logo_banner/68baf2526844c.svg",
      "/images/programs/logo_banner/68f89a4e14742.svg",
    ],
  },
  global: {
    episodes: [newEpisodes[5], newEpisodes[9], newEpisodes[0]],
    programLogos: [
      "/images/programs/logo_banner/6789c5483cb7d.svg",
      "/images/programs/logo_banner/6789c5483cb7d.svg",
      "/images/programs/logo_banner/68f892ba65fed.svg",
    ],
  },
} as const

/** おすすめのプレイリスト */
export const playlists: readonly {
  readonly id: string
  readonly title: string
  readonly episodes: readonly Episode[]
}[] = [
  { id: "p1", title: "最新のアップデート情報", episodes: [newEpisodes[0], newEpisodes[4], newEpisodes[5], newEpisodes[1]] },
  { id: "p2", title: "マネジメント上級", episodes: [newEpisodes[1], newEpisodes[7], newEpisodes[8], newEpisodes[2]] },
  { id: "p3", title: "明日のチャレンジに", episodes: [newEpisodes[2], newEpisodes[3], newEpisodes[6], newEpisodes[9]] },
  { id: "p4", title: "テクノロジー最前線", episodes: [newEpisodes[4], newEpisodes[0], newEpisodes[3], newEpisodes[7]] },
] as const

/** カテゴリ別 新着エピソード */
export const categoryEpisodes: readonly {
  readonly code: string
  readonly label: string
  readonly episodes: readonly Episode[]
}[] = [
  {
    code: "business",
    label: "ビジネス",
    episodes: [
      newEpisodes[1], newEpisodes[6], newEpisodes[7], newEpisodes[4],
    ],
  },
  {
    code: "money",
    label: "マネー",
    episodes: [
      newEpisodes[2], newEpisodes[8], newEpisodes[1], newEpisodes[9],
    ],
  },
  {
    code: "career",
    label: "キャリア",
    episodes: [
      newEpisodes[7], newEpisodes[1], newEpisodes[6], newEpisodes[2],
    ],
  },
  {
    code: "life",
    label: "ライフ",
    episodes: [
      newEpisodes[3], newEpisodes[7], newEpisodes[8], newEpisodes[2],
    ],
  },
  {
    code: "technology",
    label: "テクノロジー",
    episodes: [
      newEpisodes[0], newEpisodes[4], newEpisodes[3], newEpisodes[7],
    ],
  },
  {
    code: "global",
    label: "グローバル",
    episodes: [
      newEpisodes[5], newEpisodes[9], newEpisodes[0], newEpisodes[4],
    ],
  },
] as const
