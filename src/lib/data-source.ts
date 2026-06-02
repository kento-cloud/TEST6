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
      .select("id, title, description, duration, thumbnail_path, category_code, program_id, published_at, source_type")
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
        sourceType: (v.source_type as string) ?? "local",
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

/** フィーチャードアイテム — 公開済み動画（記事除く）の最新5件をフィーチャード */
export async function getFeaturedItems() {
  try {
    const { data: videos } = await supabase
      .from("videos")
      .select("id, title, description, thumbnail_path, program_id, youtube_video_id")
      .eq("publish_status", "published")
      .neq("source_type", "article")
      .order("published_at", { ascending: false })
      .limit(5)

    if (!videos || videos.length === 0) return getStaticFeaturedItems()

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
    { id: "14365", title: "GPT-5は本当に人間を超えたのか？徹底検証", subtitle: "AI MEDIA TALK", description: "最新フラッグシップモデルの実力を、実タスクで多角的に検証する。", thumbnailUrl: "/images/static/converted/chapter/14365/ogp/14365.webp", programLogoUrl: "/images/programs/logo_banner/68f892ba65fed.svg", youtubeVideoId: null },
    { id: "14305", title: "米中AI開発競争。日本が遅れる本当の理由", subtitle: "AI MEDIA GLOBAL", description: "世界のAI覇権争いの構図と、日本企業が直面する壁を読み解く。", thumbnailUrl: "/images/static/converted/chapter/14305/ogp/14305.webp", programLogoUrl: "/images/programs/logo_banner/6789c5483cb7d.svg", youtubeVideoId: null },
    { id: "14317", title: "プロンプト1つで成果が10倍。実務で効く指示の書き方", subtitle: "実践プロンプト", description: "現場で使えるプロンプト設計の型を、具体例とともに解説。", thumbnailUrl: "/images/static/converted/chapter/14317/ogp/14317.webp", programLogoUrl: "/images/programs/logo_banner/68baf2526844c.svg", youtubeVideoId: null },
    { id: "14325", title: "ChatGPTだけで月収100万円。AI副業の全手順【実践者タケシ】", subtitle: "AI活用ラボ", description: "生成AIを使った収益化の仕組みと、再現性のある手順を公開。", thumbnailUrl: "/images/static/converted/chapter/14325/ogp/14325.webp", programLogoUrl: "/images/programs/logo_banner/688dc66289db3.svg", youtubeVideoId: null },
    { id: "14328", title: "OpenAI一強時代は終わるのか？【業界キーパーソン】", subtitle: "インサイダーEYE", description: "主要AI企業の戦略と、勢力図の変化を追う。", thumbnailUrl: "/images/static/converted/chapter/14328/ogp/14328.webp", programLogoUrl: "/images/programs/logo_banner/68b86024e30ae.svg", youtubeVideoId: null },
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
          { code: "race", label: "最新ニュース" },
          { code: "betting", label: "実践・活用" },
          { code: "breeding", label: "AIの基礎" },
          { code: "training", label: "モデル開発" },
          { code: "science", label: "AIサイエンス" },
          { code: "global", label: "海外動向" },
        ]

    return categoryList.map(({ code, label }) => {
      const filtered = episodes.filter((e) => e.categoryCode === code)
      return {
        code,
        label,
        episodes: filtered.length > 0 ? filtered : episodes.slice(0, 4),
      }
    })
  } catch {
    return staticCategoryEpisodes
  }
}

/** カテゴリ別フィーチャード — 将来: Supabase featured テーブルからカテゴリ別に取得 */
export async function getCategoryFeatured() {
  try {
    const episodes = await getPublishedEpisodes()
    if (episodes.length === 0) return staticCategoryFeatured

    const { data: dbCategories } = await supabase
      .from("categories")
      .select("code")
      .order("sort_order", { ascending: true })

    const codes = (dbCategories ?? []).map(c => c.code as string)
    if (codes.length === 0) return staticCategoryFeatured

    const result: Record<string, { episodes: readonly Episode[]; programLogos: readonly string[] }> = {}
    for (const code of codes) {
      const matched = episodes.filter(e => e.categoryCode === code).slice(0, 3)
      if (matched.length === 0) {
        // カテゴリに該当なければ全体から埋める
        result[code] = { episodes: episodes.slice(0, 3), programLogos: [] }
      } else {
        result[code] = { episodes: matched, programLogos: [] }
      }
    }
    return result
  } catch {
    return staticCategoryFeatured
  }
}

/** プレイリスト — DB公開動画（記事除く）から動的に生成 */
export async function getPlaylists() {
  try {
    const allEpisodes = await getPublishedEpisodes()
    const episodes = allEpisodes.filter(e => e.sourceType !== "article")
    if (episodes.length < 2) return staticPlaylists

    return [
      { id: "p1", title: "今週の最新AIニュース", episodes: episodes.slice(0, 4) },
      { id: "p2", title: "AI活用マスター講座", episodes: [...episodes].reverse().slice(0, 4) },
      { id: "p3", title: "次に来る注目AIスタートアップ", episodes: episodes.slice(1, 5) },
      { id: "p4", title: "プロンプト&業務自動化", episodes: [...episodes.slice(2), ...episodes.slice(0, 2)].slice(0, 4) },
    ]
  } catch {
    return staticPlaylists
  }
}

/**
 * 検索 — Supabase ilike + メトリクス結合
 * DB接続時はtitle/descriptionでilike検索し、metricsをjoinして返す。
 * 失敗時は静的データでフォールバック。
 */
export async function searchEpisodes(query: string): Promise<readonly Episode[]> {
  if (!query.trim()) return getPublishedEpisodes()

  const q = query.trim()

  try {
    const escaped = q.replace(/[%_\\]/g, (c) => `\\${c}`)

    const { data: videos, error } = await supabase
      .from("videos")
      .select("id, title, description, duration, thumbnail_path, category_code, program_id, published_at")
      .eq("publish_status", "published")
      .or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`)
      .order("published_at", { ascending: false })

    if (error || !videos || videos.length === 0) {
      // DB検索が空の場合は静的データにフォールバック
      return await fallbackSearchEpisodes(q)
    }

    const videoIds = videos.map((v) => v.id as string)

    const { data: allMetrics } = await supabase
      .from("metrics")
      .select("video_id, view_count, comment_count, rating")
      .in("video_id", videoIds)
    const metricsMap = new Map((allMetrics ?? []).map((m) => [m.video_id as string, m]))

    const programIds = [...new Set(videos.map((v) => v.program_id as number | null).filter((id): id is number => id !== null))]
    const programMap = new Map<number, string>()
    if (programIds.length > 0) {
      const { data: progs } = await supabase.from("programs").select("id, name").in("id", programIds)
      for (const p of progs ?? []) {
        programMap.set(p.id as number, p.name as string)
      }
    }

    return videos.map((v) => {
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
  } catch {
    return await fallbackSearchEpisodes(q)
  }
}

/** フォールバック検索（DB公開動画で検索） */
async function fallbackSearchEpisodes(query: string): Promise<readonly Episode[]> {
  const q = query.toLowerCase()
  const episodes = await getPublishedEpisodes()
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
