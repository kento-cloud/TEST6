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
    title: "GPT-5は本当に人間を超えたのか？徹底検証",
    programName: "AI MEDIA TALK",
    duration: "20:04",
    viewCount: "1.2万回視聴",
    publishedAt: "1日前",
    thumbnailUrl: thumb(14365),
    commentCount: 0,
    rating: 4.5,
    description: "最新フラッグシップモデルの実力をベンチマークと実タスクで検証。",
    categoryCode: "race",
  },
  {
    id: "14328",
    title: "OpenAI一強時代は終わるのか？【業界キーパーソン】",
    programName: "経営者EYE",
    duration: "28:29",
    viewCount: "3.8万回視聴",
    publishedAt: "2日前",
    thumbnailUrl: thumb(14328),
    commentCount: 2,
    rating: 4.3,
    description: "主要AI企業の競争構図と勢力図の変化を追う。",
    categoryCode: "breeding",
  },
  {
    id: "14325",
    title: "ChatGPTだけで月収100万円。AI副業の全手順【実践者タケシ】",
    programName: "プロンプトラボ",
    duration: "38:42",
    viewCount: "7.4万回視聴",
    publishedAt: "2日前",
    thumbnailUrl: thumb(14325),
    commentCount: 7,
    rating: 4.5,
    description: "生成AIを使った副業の収益構造と再現性のある手順を公開。",
    categoryCode: "betting",
  },
  {
    id: "14287",
    title: "【LLMの科学】Transformerはなぜ賢いのか、その仕組みに迫る",
    programName: "AIサイエンス",
    duration: "20:43",
    viewCount: "2.1万回視聴",
    publishedAt: "2日前",
    thumbnailUrl: thumb(14287),
    commentCount: 1,
    rating: 4.7,
    description: "大規模言語モデルの中核技術を科学的に解剖する。",
    categoryCode: "science",
  },
  {
    id: "14317",
    title: "主要AIモデルを徹底比較／ベンチマーク分析／用途別の選び方",
    programName: "最新モデル超分析",
    duration: "32:12",
    viewCount: "8.3万回視聴",
    publishedAt: "3日前",
    thumbnailUrl: thumb(14317),
    commentCount: 8,
    rating: 4.8,
    description: "注目モデルをデータとベンチマークで徹底分析。用途別の選び方も。",
    categoryCode: "race",
  },
  {
    id: "14305",
    title: "米中AI開発競争。日本が遅れる本当の理由",
    programName: "AI MEDIA GLOBAL",
    duration: "26:58",
    viewCount: "6.7万回視聴",
    publishedAt: "3日前",
    thumbnailUrl: thumb(14305),
    commentCount: 4,
    rating: 4.2,
    description: "世界のAI覇権争いと、日本の立ち位置を検証。",
    categoryCode: "global",
  },
  {
    id: "14364",
    title: "次に来る注目AIスタートアップ。資金調達から見える可能性",
    programName: "AI進化クロニクル",
    duration: "23:36",
    viewCount: "1.8万回視聴",
    publishedAt: "4日前",
    thumbnailUrl: thumb(14364),
    commentCount: 2,
    rating: 4.1,
    description: "今年注目の新興AI企業の事業と成長性を分析。",
    categoryCode: "breeding",
  },
  {
    id: "14316",
    title: "【実践】業務で使えるAIツール5選と導入のコツ",
    programName: "活用の虎の巻",
    duration: "27:45",
    viewCount: "3.2万回視聴",
    publishedAt: "4日前",
    thumbnailUrl: thumb(14316),
    commentCount: 6,
    rating: 4.5,
    description: "現場で成果が出るAIツールの選定と導入のポイントを解説。",
    categoryCode: "training",
  },
  {
    id: "14362",
    title: "RAG構築完全ガイド／社内データをAIに繋ぐ手順【実践】",
    programName: "プロンプトラボ",
    duration: "30:09",
    viewCount: "4.1万回視聴",
    publishedAt: "4日前",
    thumbnailUrl: thumb(14362),
    commentCount: 3,
    rating: 4.3,
    description: "埋め込みからベクトル検索まで、RAG構築の手順を完全ガイド。",
    categoryCode: "training",
  },
  {
    id: "14357",
    title: "OpenAI・Google・Anthropic。主要AI企業の戦略を読む",
    programName: "AI MEDIA GLOBAL",
    duration: "55:49",
    viewCount: "5.5万回視聴",
    publishedAt: "5日前",
    thumbnailUrl: thumb(14357),
    commentCount: 12,
    rating: 4.4,
    description: "主要AI企業のプロダクト戦略と今後の競争軸を解説。",
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
        title: "主要AIモデルを徹底比較／ベンチマーク分析／用途別の選び方",
        programName: "最新モデル超分析",
        duration: "32:12",
        viewCount: "8.3万回視聴",
        publishedAt: "3日前",
        thumbnailUrl: thumb(14317),
        commentCount: 8, rating: 4.8, description: "",
      },
      {
        id: "12600",
        title: "GPTシリーズはなぜ強いのか。進化の系譜を辿る",
        programName: "AI進化クロニクル",
        duration: "37:33",
        viewCount: "12万回視聴",
        publishedAt: "3か月前",
        thumbnailUrl: thumb(12600),
        commentCount: 15, rating: 4.7, description: "",
      },
      {
        id: "14305",
        title: "米中AI開発競争。日本が遅れる本当の理由",
        programName: "AI MEDIA GLOBAL",
        duration: "26:58",
        viewCount: "6.7万回視聴",
        publishedAt: "3日前",
        thumbnailUrl: thumb(14305),
        commentCount: 4, rating: 4.2, description: "",
      },
      {
        id: "14325",
        title: "ChatGPTだけで月収100万円。AI副業の全手順【実践者タケシ】",
        programName: "プロンプトラボ",
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
        title: "AIエンジニアの働き方とスキルの磨き方",
        programName: "AIサイエンス",
        duration: "39:48",
        viewCount: "9.1万回視聴",
        publishedAt: "2週間前",
        thumbnailUrl: thumb(14293),
        commentCount: 10, rating: 4.6, description: "",
      },
      {
        id: "14328",
        title: "OpenAI一強時代は終わるのか？【業界キーパーソン】",
        programName: "経営者EYE",
        duration: "28:29",
        viewCount: "3.8万回視聴",
        publishedAt: "2日前",
        thumbnailUrl: thumb(14328),
        commentCount: 2, rating: 4.3, description: "",
      },
      {
        id: "14317",
        title: "主要AIモデルを徹底比較／ベンチマーク分析／用途別の選び方",
        programName: "最新モデル超分析",
        duration: "32:12",
        viewCount: "8.3万回視聴",
        publishedAt: "3日前",
        thumbnailUrl: thumb(14317),
        commentCount: 8, rating: 4.8, description: "",
      },
      {
        id: "14362",
        title: "RAG構築完全ガイド／社内データをAIに繋ぐ手順【実践】",
        programName: "プロンプトラボ",
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
        title: "ChatGPTだけで月収100万円。AI副業の全手順【実践者タケシ】",
        programName: "プロンプトラボ",
        duration: "38:42",
        viewCount: "7.4万回視聴",
        publishedAt: "5日前",
        thumbnailUrl: thumb(14325),
        commentCount: 7, rating: 4.5, description: "",
      },
      {
        id: "14357",
        title: "OpenAI・Google・Anthropic。主要AI企業の戦略を読む",
        programName: "AI MEDIA GLOBAL",
        duration: "55:49",
        viewCount: "5.5万回視聴",
        publishedAt: "5日前",
        thumbnailUrl: thumb(14357),
        commentCount: 12, rating: 4.4, description: "",
      },
      {
        id: "14305",
        title: "米中AI開発競争。日本が遅れる本当の理由",
        programName: "AI MEDIA GLOBAL",
        duration: "26:58",
        viewCount: "6.7万回視聴",
        publishedAt: "3日前",
        thumbnailUrl: thumb(14305),
        commentCount: 4, rating: 4.2, description: "",
      },
      {
        id: "14363",
        title: "中東のAI投資が変える勢力図。ソブリンファンドの狙い",
        programName: "AI MEDIA GLOBAL",
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
  { id: "p1", title: "今週の注目AIニュース", episodes: [newEpisodes[0], newEpisodes[4], newEpisodes[5], newEpisodes[1]] },
  { id: "p2", title: "AI活用マスター講座", episodes: [newEpisodes[2], newEpisodes[7], newEpisodes[8], newEpisodes[4]] },
  { id: "p3", title: "AIの基礎から学ぶ", episodes: [newEpisodes[1], newEpisodes[6], newEpisodes[3], newEpisodes[9]] },
  { id: "p4", title: "実践・モデル開発", episodes: [newEpisodes[7], newEpisodes[8], newEpisodes[3], newEpisodes[0]] },
] as const

/** カテゴリ別 新着エピソード */
export const categoryEpisodes: readonly {
  readonly code: string
  readonly label: string
  readonly episodes: readonly Episode[]
}[] = [
  {
    code: "race",
    label: "最新ニュース",
    episodes: [
      newEpisodes[0], newEpisodes[4], newEpisodes[5], newEpisodes[9],
    ],
  },
  {
    code: "betting",
    label: "実践・活用",
    episodes: [
      newEpisodes[2], newEpisodes[4], newEpisodes[0], newEpisodes[7],
    ],
  },
  {
    code: "breeding",
    label: "AIの基礎",
    episodes: [
      newEpisodes[1], newEpisodes[6], newEpisodes[3], newEpisodes[9],
    ],
  },
  {
    code: "training",
    label: "モデル開発",
    episodes: [
      newEpisodes[7], newEpisodes[8], newEpisodes[3], newEpisodes[2],
    ],
  },
  {
    code: "science",
    label: "AIサイエンス",
    episodes: [
      newEpisodes[3], newEpisodes[7], newEpisodes[8], newEpisodes[0],
    ],
  },
  {
    code: "global",
    label: "海外動向",
    episodes: [
      newEpisodes[5], newEpisodes[9], newEpisodes[1], newEpisodes[6],
    ],
  },
] as const
