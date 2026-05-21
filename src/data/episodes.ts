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
    title: "有馬記念の展望 \"最強ステイヤー\"はどの馬か？",
    programName: "PADDOCK TALK",
    duration: "20:04",
    viewCount: "1.2万回視聴",
    publishedAt: "1日前",
    thumbnailUrl: thumb(14365),
    commentCount: 0,
    rating: 4.5,
    description: "今年の有馬記念、出走予定馬の適性と展開を徹底分析。",
    categoryCode: "race",
  },
  {
    id: "14328",
    title: "ノーザンファーム一強時代は終わるのか？【吉田勝己代表】",
    programName: "オーナーズEYE",
    duration: "28:29",
    viewCount: "3.8万回視聴",
    publishedAt: "2日前",
    thumbnailUrl: thumb(14328),
    commentCount: 2,
    rating: 4.3,
    description: "社台グループの戦略と競馬界の勢力図の変化を追う。",
    categoryCode: "breeding",
  },
  {
    id: "14325",
    title: "馬券で月収100万円を達成した男の回収率管理術【馬券師タケシ】",
    programName: "馬券ラボ",
    duration: "38:42",
    viewCount: "7.4万回視聴",
    publishedAt: "2日前",
    thumbnailUrl: thumb(14325),
    commentCount: 7,
    rating: 4.5,
    description: "データ派馬券師が明かす資金管理と期待値計算の全貌。",
    categoryCode: "betting",
  },
  {
    id: "14287",
    title: "【競走馬の科学】筋肉と心肺機能の限界に迫る",
    programName: "ターフサイエンス",
    duration: "20:43",
    viewCount: "2.1万回視聴",
    publishedAt: "2日前",
    thumbnailUrl: thumb(14287),
    commentCount: 1,
    rating: 4.7,
    description: "サラブレッドの身体能力を科学的に解剖する。",
    categoryCode: "science",
  },
  {
    id: "14317",
    title: "AIで予想する日本ダービー／過去データ分析／穴馬の見つけ方",
    programName: "レース超分析",
    duration: "32:12",
    viewCount: "8.3万回視聴",
    publishedAt: "3日前",
    thumbnailUrl: thumb(14317),
    commentCount: 8,
    rating: 4.8,
    description: "注目レースをデータとAIで徹底分析。穴馬候補も。",
    categoryCode: "race",
  },
  {
    id: "14305",
    title: "凱旋門賞に挑む日本馬。海外遠征の壁とは",
    programName: "PADDOCK GLOBAL",
    duration: "26:58",
    viewCount: "6.7万回視聴",
    publishedAt: "3日前",
    thumbnailUrl: thumb(14305),
    commentCount: 4,
    rating: 4.2,
    description: "日本馬の海外挑戦。馬場適性と輸送の影響を検証。",
    categoryCode: "global",
  },
  {
    id: "14364",
    title: "新種牡馬ランキング。初年度産駒から見える可能性",
    programName: "血統クロニクル",
    duration: "23:36",
    viewCount: "1.8万回視聴",
    publishedAt: "4日前",
    thumbnailUrl: thumb(14364),
    commentCount: 2,
    rating: 4.1,
    description: "今年デビューした新種牡馬の産駒傾向を分析。",
    categoryCode: "breeding",
  },
  {
    id: "14316",
    title: "【実践】パドックで馬の調子を見抜く5つのポイント",
    programName: "馬体チェック",
    duration: "27:45",
    viewCount: "3.2万回視聴",
    publishedAt: "4日前",
    thumbnailUrl: thumb(14316),
    commentCount: 6,
    rating: 4.5,
    description: "プロが教えるパドック診断の基本と応用テクニック。",
    categoryCode: "training",
  },
  {
    id: "14362",
    title: "坂路調教のタイム読み方完全ガイド【栗東トレセン】",
    programName: "調教ウォッチ",
    duration: "30:09",
    viewCount: "4.1万回視聴",
    publishedAt: "4日前",
    thumbnailUrl: thumb(14362),
    commentCount: 3,
    rating: 4.3,
    description: "坂路タイムの見方から好走パターンを見抜く方法。",
    categoryCode: "training",
  },
  {
    id: "14357",
    title: "ドバイ・香港・サウジ。世界の高額賞金レース戦略",
    programName: "PADDOCK GLOBAL",
    duration: "55:49",
    viewCount: "5.5万回視聴",
    publishedAt: "5日前",
    thumbnailUrl: thumb(14357),
    commentCount: 12,
    rating: 4.4,
    description: "世界の主要レースの特徴と日本馬の適性を解説。",
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
        title: "AIで予想する日本ダービー／過去データ分析／穴馬の見つけ方",
        programName: "レース超分析",
        duration: "32:12",
        viewCount: "8.3万回視聴",
        publishedAt: "3日前",
        thumbnailUrl: thumb(14317),
        commentCount: 8, rating: 4.8, description: "",
      },
      {
        id: "12600",
        title: "ディープインパクト産駒はなぜ走るのか",
        programName: "血統クロニクル",
        duration: "37:33",
        viewCount: "12万回視聴",
        publishedAt: "3か月前",
        thumbnailUrl: thumb(12600),
        commentCount: 15, rating: 4.7, description: "",
      },
      {
        id: "14305",
        title: "凱旋門賞に挑む日本馬。海外遠征の壁とは",
        programName: "PADDOCK GLOBAL",
        duration: "26:58",
        viewCount: "6.7万回視聴",
        publishedAt: "3日前",
        thumbnailUrl: thumb(14305),
        commentCount: 4, rating: 4.2, description: "",
      },
      {
        id: "14325",
        title: "馬券で月収100万円を達成した男の回収率管理術【馬券師タケシ】",
        programName: "馬券ラボ",
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
        title: "騎手の体重管理とメンタルコントロール術",
        programName: "ターフサイエンス",
        duration: "39:48",
        viewCount: "9.1万回視聴",
        publishedAt: "2週間前",
        thumbnailUrl: thumb(14293),
        commentCount: 10, rating: 4.6, description: "",
      },
      {
        id: "14328",
        title: "ノーザンファーム一強時代は終わるのか？【吉田勝己代表】",
        programName: "オーナーズEYE",
        duration: "28:29",
        viewCount: "3.8万回視聴",
        publishedAt: "2日前",
        thumbnailUrl: thumb(14328),
        commentCount: 2, rating: 4.3, description: "",
      },
      {
        id: "14317",
        title: "AIで予想する日本ダービー／過去データ分析／穴馬の見つけ方",
        programName: "レース超分析",
        duration: "32:12",
        viewCount: "8.3万回視聴",
        publishedAt: "3日前",
        thumbnailUrl: thumb(14317),
        commentCount: 8, rating: 4.8, description: "",
      },
      {
        id: "14362",
        title: "坂路調教のタイム読み方完全ガイド【栗東トレセン】",
        programName: "調教ウォッチ",
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
        title: "馬券で月収100万円を達成した男の回収率管理術【馬券師タケシ】",
        programName: "馬券ラボ",
        duration: "38:42",
        viewCount: "7.4万回視聴",
        publishedAt: "5日前",
        thumbnailUrl: thumb(14325),
        commentCount: 7, rating: 4.5, description: "",
      },
      {
        id: "14357",
        title: "ドバイ・香港・サウジ。世界の高額賞金レース戦略",
        programName: "PADDOCK GLOBAL",
        duration: "55:49",
        viewCount: "5.5万回視聴",
        publishedAt: "5日前",
        thumbnailUrl: thumb(14357),
        commentCount: 12, rating: 4.4, description: "",
      },
      {
        id: "14305",
        title: "凱旋門賞に挑む日本馬。海外遠征の壁とは",
        programName: "PADDOCK GLOBAL",
        duration: "26:58",
        viewCount: "6.7万回視聴",
        publishedAt: "3日前",
        thumbnailUrl: thumb(14305),
        commentCount: 4, rating: 4.2, description: "",
      },
      {
        id: "14363",
        title: "サウジカップの衝撃。中東マネーが変える競馬地図",
        programName: "PADDOCK GLOBAL",
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
  race: {
    episodes: [newEpisodes[0], newEpisodes[4], newEpisodes[5]],
    programLogos: [
      "/images/programs/logo_banner/68f892ba65fed.svg",
      "/images/programs/logo_banner/68baf2526844c.svg",
      "/images/programs/logo_banner/6789c5483cb7d.svg",
    ],
  },
  betting: {
    episodes: [newEpisodes[2], newEpisodes[4], newEpisodes[0]],
    programLogos: [
      "/images/programs/logo_banner/688dc66289db3.svg",
      "/images/programs/logo_banner/68baf2526844c.svg",
      "/images/programs/logo_banner/68f892ba65fed.svg",
    ],
  },
  breeding: {
    episodes: [newEpisodes[1], newEpisodes[6], newEpisodes[3]],
    programLogos: [
      "/images/programs/logo_banner/68b86024e30ae.svg",
      "/images/programs/logo_banner/6789c5483cb7d.svg",
      "/images/programs/logo_banner/68f89a4e14742.svg",
    ],
  },
  training: {
    episodes: [newEpisodes[7], newEpisodes[8], newEpisodes[3]],
    programLogos: [
      "/images/programs/logo_banner/68baf2526844c.svg",
      "/images/programs/logo_banner/688dc66289db3.svg",
      "/images/programs/logo_banner/68f89a4e14742.svg",
    ],
  },
  science: {
    episodes: [newEpisodes[3], newEpisodes[7], newEpisodes[8]],
    programLogos: [
      "/images/programs/logo_banner/68f89a4e14742.svg",
      "/images/programs/logo_banner/68baf2526844c.svg",
      "/images/programs/logo_banner/688dc66289db3.svg",
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
  { id: "p1", title: "今週の重賞プレビュー", episodes: [newEpisodes[0], newEpisodes[4], newEpisodes[5], newEpisodes[1]] },
  { id: "p2", title: "馬券術マスター講座", episodes: [newEpisodes[2], newEpisodes[7], newEpisodes[8], newEpisodes[4]] },
  { id: "p3", title: "血統から読む次の大物", episodes: [newEpisodes[1], newEpisodes[6], newEpisodes[3], newEpisodes[9]] },
  { id: "p4", title: "調教・パドック攻略", episodes: [newEpisodes[7], newEpisodes[8], newEpisodes[3], newEpisodes[0]] },
] as const

/** カテゴリ別 新着エピソード */
export const categoryEpisodes: readonly {
  readonly code: string
  readonly label: string
  readonly episodes: readonly Episode[]
}[] = [
  {
    code: "race",
    label: "レース分析",
    episodes: [
      newEpisodes[0], newEpisodes[4], newEpisodes[5], newEpisodes[9],
    ],
  },
  {
    code: "betting",
    label: "馬券・予想",
    episodes: [
      newEpisodes[2], newEpisodes[4], newEpisodes[0], newEpisodes[7],
    ],
  },
  {
    code: "breeding",
    label: "血統・生産",
    episodes: [
      newEpisodes[1], newEpisodes[6], newEpisodes[3], newEpisodes[9],
    ],
  },
  {
    code: "training",
    label: "調教・馬体",
    episodes: [
      newEpisodes[7], newEpisodes[8], newEpisodes[3], newEpisodes[2],
    ],
  },
  {
    code: "science",
    label: "競馬サイエンス",
    episodes: [
      newEpisodes[3], newEpisodes[7], newEpisodes[8], newEpisodes[0],
    ],
  },
  {
    code: "global",
    label: "海外競馬",
    episodes: [
      newEpisodes[5], newEpisodes[9], newEpisodes[1], newEpisodes[6],
    ],
  },
] as const
