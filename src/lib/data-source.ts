/**
 * データソース層 — Supabase公式クライアント版
 *
 * 全てのデータ取得をここに集約。
 * コンポーネントはpropsでデータを受け取り、このファイルに依存しない。
 *
 * 戦略:
 * - Supabase公式クライアントでasync呼び出し
 * - 失敗時は静的データにフォールバック
 * - キャッシュTTL: 5秒
 */

import {
  newEpisodes as staticEpisodes,
  rankings as staticRankings,
  categoryEpisodes as staticCategoryEpisodes,
  categoryFeatured as staticCategoryFeatured,
  playlists as staticPlaylists,
} from "@/data/episodes"
import { programs as staticPrograms } from "@/data/programs"
import type { Episode, Program } from "@/types"
import type { Chapter } from "@/types/ai"
import { FALLBACK_THUMBNAIL } from "./constants"
import { supabase } from "./supabase"

// ============================================================
// Episodes
// ============================================================

/** 公開済み動画 */
export async function getPublishedEpisodes(): Promise<readonly Episode[]> {
  return fetchPublishedEpisodes()
}

/** 全エピソード */
export async function getAllEpisodes(): Promise<readonly Episode[]> {
  return getPublishedEpisodes()
}

let _cachedEpisodes: Episode[] | null = null
let _cacheTime = 0
const CACHE_TTL = 5000 // 5秒 — 管理画面からの変更を素早く反映

async function fetchPublishedEpisodes(): Promise<readonly Episode[]> {
  if (_cachedEpisodes && Date.now() - _cacheTime < CACHE_TTL) {
    return _cachedEpisodes
  }

  try {
    const { data: videos, error } = await supabase
      .from("videos")
      .select("id, title, description, duration, thumbnail_path, category_code, program_id, published_at")
      .eq("publish_status", "published")
      .order("published_at", { ascending: false })

    if (error || !videos || videos.length === 0) return staticEpisodes

    const { data: allMetrics } = await supabase.from("metrics").select("video_id, view_count, comment_count, rating")
    const metricsMap = new Map((allMetrics ?? []).map((m) => [m.video_id as string, m]))

    const { data: allPrograms } = await supabase.from("programs").select("id, name")
    const programMap = new Map((allPrograms ?? []).map((p) => [p.id as number, p.name as string]))

    _cachedEpisodes = videos.map((v) => {
      const m = metricsMap.get(v.id as string)
      const programId = v.program_id as number | null
      return {
        id: v.id as string,
        title: v.title as string,
        programName: (programId ? programMap.get(programId) : null) ?? "",
        duration: v.duration ? formatDuration(v.duration as number) : "",
        viewCount: m && (m.view_count as number) > 0 ? formatViewCount(m.view_count as number) : "",
        publishedAt: v.published_at ? formatRelativeTime(v.published_at as string) : "",
        thumbnailUrl: (v.thumbnail_path as string) ?? FALLBACK_THUMBNAIL,
        commentCount: (m?.comment_count as number) ?? 0,
        rating: (m?.rating as number) ?? 0,
        description: (v.description as string) ?? "",
        categoryCode: (v.category_code as string) ?? undefined,
      }
    })
    _cacheTime = Date.now()
    return _cachedEpisodes
  } catch {
    return staticEpisodes
  }
}

/** ランキングデータ — Supabaseの視聴数・評価からランキングを動的生成 */
export async function getRankings() {
  try {
    const episodes = await getPublishedEpisodes()
    if (episodes.length === 0) return staticRankings

    // 視聴数でソート（viewCountから数値を抽出）
    const sorted = [...episodes].sort((a, b) => {
      const aNum = parseViewCount(a.viewCount)
      const bNum = parseViewCount(b.viewCount)
      return bNum - aNum
    })

    const top = sorted.slice(0, 10)
    return [
      { label: "年間", key: "yearly", episodes: top },
      { label: "月間", key: "monthly", episodes: top.slice(0, 8) },
      { label: "週間", key: "weekly", episodes: top.slice(0, 6) },
    ]
  } catch {
    return staticRankings
  }
}

/** フィーチャードアイテム — 公開済み動画の上位をフィーチャード */
export async function getFeaturedItems() {
  try {
    const { data: videos, error } = await supabase
      .from("videos")
      .select("id, title, description, thumbnail_path, program_id, youtube_video_id")
      .eq("publish_status", "published")
      .order("published_at", { ascending: false })
      .limit(5)

    if (error || !videos || videos.length === 0) return getStaticFeaturedItems()

    // 番組ロゴも取得
    const { data: allPrograms } = await supabase.from("programs").select("id, name, logo_path")
    const programMap = new Map((allPrograms ?? []).map((p) => [p.id as number, { name: p.name as string, logo: (p.logo_path as string) ?? "" }]))

    return videos.map((v) => {
      const prog = v.program_id ? programMap.get(v.program_id as number) : null
      return {
        id: v.id as string,
        title: v.title as string,
        subtitle: prog?.name ?? "",
        description: (v.description as string) ?? "",
        thumbnailUrl: (v.thumbnail_path as string) ?? FALLBACK_THUMBNAIL,
        programLogoUrl: prog?.logo ?? "",
        youtubeVideoId: (v.youtube_video_id as string) ?? null,
      }
    })
  } catch {
    return getStaticFeaturedItems()
  }
}

function getStaticFeaturedItems() {
  return [
    { id: "14365", title: "有馬記念の展望 \"最強ステイヤー\"はどの馬か？", subtitle: "PADDOCK TALK", description: "今年の有馬記念、出走予定馬の適性と展開を徹底分析。", thumbnailUrl: "/images/static/converted/chapter/14365/ogp/14365.webp", programLogoUrl: "/images/programs/logo_banner/68f892ba65fed.svg", youtubeVideoId: null },
    { id: "14305", title: "凱旋門賞に挑む日本馬。海外遠征の壁とは", subtitle: "PADDOCK GLOBAL", description: "日本馬の海外挑戦。馬場適性と輸送の影響を検証。", thumbnailUrl: "/images/static/converted/chapter/14305/ogp/14305.webp", programLogoUrl: "/images/programs/logo_banner/6789c5483cb7d.svg", youtubeVideoId: null },
    { id: "14317", title: "AIで予想する日本ダービー／過去データ分析／穴馬の見つけ方", subtitle: "レース超分析", description: "注目レースをデータとAIで徹底分析。穴馬候補も。", thumbnailUrl: "/images/static/converted/chapter/14317/ogp/14317.webp", programLogoUrl: "/images/programs/logo_banner/68baf2526844c.svg", youtubeVideoId: null },
    { id: "14325", title: "馬券で月収100万円を達成した男の回収率管理術【馬券師タケシ】", subtitle: "馬券ラボ", description: "データ派馬券師が明かす資金管理と期待値計算の全貌。", thumbnailUrl: "/images/static/converted/chapter/14325/ogp/14325.webp", programLogoUrl: "/images/programs/logo_banner/688dc66289db3.svg", youtubeVideoId: null },
    { id: "14328", title: "ノーザンファーム一強時代は終わるのか？【吉田勝己代表】", subtitle: "オーナーズEYE", description: "社台グループの戦略と競馬界の勢力図の変化を追う。", thumbnailUrl: "/images/static/converted/chapter/14328/ogp/14328.webp", programLogoUrl: "/images/programs/logo_banner/68b86024e30ae.svg", youtubeVideoId: null },
  ] as const
}

/** カテゴリ別新着エピソード — DB公開動画をcategory_codeでグループ化 */
export async function getCategoryEpisodes() {
  try {
    const episodes = await getPublishedEpisodes()
    if (episodes.length === 0) return staticCategoryEpisodes

    const { data: dbCategories } = await supabase
      .from("categories")
      .select("code, label")
      .order("sort_order", { ascending: true })

    const categoryList = (dbCategories && dbCategories.length > 0)
      ? dbCategories.map(c => ({ code: c.code as string, label: c.label as string }))
      : [
          { code: "race", label: "レース分析" },
          { code: "betting", label: "馬券・予想" },
          { code: "breeding", label: "血統・生産" },
          { code: "training", label: "調教・馬体" },
          { code: "science", label: "競馬サイエンス" },
          { code: "global", label: "海外競馬" },
        ]

    return categoryList.map(({ code, label }) => {
      const filtered = episodes.filter((e) => e.categoryCode === code)
      const staticCat = staticCategoryEpisodes.find((c) => c.code === code)
      return {
        code,
        label,
        episodes: filtered.length > 0 ? filtered : (staticCat?.episodes ?? []),
      }
    })
  } catch {
    return staticCategoryEpisodes
  }
}

/** カテゴリ別フィーチャード — 将来: Supabase featured テーブルからカテゴリ別に取得 */
export async function getCategoryFeatured() {
  return staticCategoryFeatured
}

/** プレイリスト — 将来: Supabase playlists テーブルから取得 */
export async function getPlaylists() {
  return staticPlaylists
}

/**
 * 検索 — 将来: Supabase Full-Text Search 対応
 * 現在はクライアント側フィルタリング。
 * DB切り替え時はこの関数に Supabase の textSearch/ilike を実装する。
 */
export async function searchEpisodes(query: string): Promise<readonly Episode[]> {
  const episodes = await getPublishedEpisodes()
  if (!query.trim()) return episodes
  const q = query.toLowerCase()
  return episodes.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.programName.toLowerCase().includes(q)
  )
}

/**
 * ユーザーマイリスト — 将来: ユーザー認証 + user_playlists テーブル対応
 * 現在は静的データ。DB切り替え時にユーザーIDを受け取る形に変更する。
 */
export async function getUserPlaylists(_userId?: string): Promise<readonly unknown[]> {
  return []
}

// ============================================================
// Programs
// ============================================================

/** 番組一覧 */
export async function getPrograms(): Promise<readonly Program[]> {
  try {
    const { data: programs, error } = await supabase
      .from("programs")
      .select("id, name, description, thumbnail_path")
      .eq("is_active", true)
      .order("id")

    if (error || !programs || programs.length === 0) return staticPrograms
    return programs.map((p) => ({
      id: p.id as number,
      name: p.name as string,
      description: (p.description as string) ?? "",
      thumbnailUrl: (p.thumbnail_path as string) ?? "",
      isSponsored: false,
    }))
  } catch {
    return staticPrograms
  }
}

// ============================================================
// Video Detail
// ============================================================

interface VideoDetailResult {
  video: {
    id: string
    title: string
    description: string | null
    thumbnailPath: string | null
    sourceType: string | null
    youtubeVideoId: string | null
    publishedAt: string | null
    programName: string
    filePath: string | null
  }
  transcript: string | null
  summary: string | null
  chapters: Chapter[] | null
  article: string | null
  tags: string[] | null
  metrics: Record<string, unknown> | null
}

/** 動画詳細（AI生成コンテンツ付き） */
export async function getVideoDetail(videoId: string): Promise<VideoDetailResult | null> {
  try {
    const { data: videos, error } = await supabase
      .from("videos")
      .select("*")
      .eq("id", videoId)
      .limit(1)

    if (error || !videos || videos.length === 0) return null
    const v = videos[0]

    // 番組名を取得
    let programName = ""
    if (v.program_id) {
      const { data: progs } = await supabase
        .from("programs")
        .select("name")
        .eq("id", v.program_id)
        .limit(1)
      programName = (progs?.[0]?.name as string) ?? ""
    }

    const { data: trans } = await supabase
      .from("transcriptions")
      .select("full_text")
      .eq("video_id", videoId)
      .limit(1)
    const transcript = trans?.[0] ?? null

    const { data: aiArr } = await supabase
      .from("ai_contents")
      .select("summary, chapters, article, tags")
      .eq("video_id", videoId)
      .limit(1)
    const aiContent = aiArr?.[0] ?? null

    const { data: metArr } = await supabase
      .from("metrics")
      .select("*")
      .eq("video_id", videoId)
      .limit(1)
    const metrics = (metArr?.[0] as Record<string, unknown>) ?? null

    return {
      video: {
        id: v.id as string,
        title: v.title as string,
        description: (v.description as string) ?? null,
        thumbnailPath: (v.thumbnail_path as string) ?? null,
        sourceType: (v.source_type as string) ?? null,
        youtubeVideoId: (v.youtube_video_id as string) ?? null,
        publishedAt: (v.published_at as string) ?? null,
        programName,
        filePath: (v.file_path as string) ?? null,
      },
      transcript: (transcript?.full_text as string) ?? null,
      summary: (aiContent?.summary as string) ?? null,
      chapters: aiContent?.chapters
        ? (typeof aiContent.chapters === "string" ? JSON.parse(aiContent.chapters) as Chapter[] : aiContent.chapters as Chapter[])
        : null,
      article: (aiContent?.article as string) ?? null,
      tags: aiContent?.tags
        ? (typeof aiContent.tags === "string" ? JSON.parse(aiContent.tags) as string[] : aiContent.tags as string[])
        : null,
      metrics,
    }
  } catch {
    return null
  }
}

// ============================================================
// Helpers
// ============================================================

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

function formatViewCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1).replace(/\.0$/, "")}万回視聴`
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}千回視聴`
  return `${count}回視聴`
}

function parseViewCount(str: string): number {
  const match = str.match(/([\d.]+)/)
  if (!match) return 0
  const num = parseFloat(match[1])
  if (str.includes("万")) return num * 10000
  if (str.includes("千")) return num * 1000
  return num
}

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays < 1) return "今日"
    if (diffDays < 7) return `${diffDays}日前`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}か月前`
    return `${Math.floor(diffDays / 365)}年前`
  } catch {
    return ""
  }
}
