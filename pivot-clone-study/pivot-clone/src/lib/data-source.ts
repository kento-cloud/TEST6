/**
 * データソース層 — Supabase接続版
 *
 * 全てのデータ取得をここに集約。
 * コンポーネントはpropsでデータを受け取り、このファイルに依存しない。
 *
 * 戦略:
 * - Supabase REST APIを同期的に呼ぶ（Server Component対応のためexecSync+curl）
 * - 失敗時は静的データにフォールバック
 * - キャッシュTTL: 60秒
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

// ============================================================
// Supabase同期ヘルパー
// ============================================================

function supabaseGet(path: string): unknown {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  if (!url || !key) return null

  const { execSync } = require("child_process")
  const result = execSync(
    `curl -s "${url}/rest/v1/${path}" -H "apikey: ${key}" -H "Authorization: Bearer ${key}"`,
    { encoding: "utf-8", timeout: 5000 },
  )
  return JSON.parse(result)
}

// ============================================================
// Episodes
// ============================================================

/** 公開済み動画 */
export function getPublishedEpisodes(): readonly Episode[] {
  return fetchPublishedEpisodesSync()
}

/** 全エピソード */
export function getAllEpisodes(): readonly Episode[] {
  return getPublishedEpisodes()
}

let _cachedEpisodes: Episode[] | null = null
let _cacheTime = 0
const CACHE_TTL = 5000 // 5秒 — 管理画面からの変更を素早く反映

function fetchPublishedEpisodesSync(): readonly Episode[] {
  if (_cachedEpisodes && Date.now() - _cacheTime < CACHE_TTL) {
    return _cachedEpisodes
  }

  try {
    const videos = supabaseGet("videos?publish_status=eq.published&order=published_at.desc") as Record<string, unknown>[]
    if (!Array.isArray(videos) || videos.length === 0) return staticEpisodes

    const allMetrics = supabaseGet("metrics?select=*") as Record<string, unknown>[]
    const metricsMap = new Map((allMetrics ?? []).map((m) => [m.video_id as string, m]))

    // 番組名を引くためprogramsも取得
    const allPrograms = supabaseGet("programs?select=id,name") as Record<string, unknown>[]
    const programMap = new Map((allPrograms ?? []).map((p) => [p.id as number, p.name as string]))

    _cachedEpisodes = videos.map((v) => {
      const m = metricsMap.get(v.id as string)
      const programId = v.program_id as number | null
      return {
        id: v.id as string,
        title: v.title as string,
        programName: (programId ? programMap.get(programId) : null) ?? "",
        duration: v.duration ? formatDuration(v.duration as number) : "",
        viewCount: m ? formatViewCount((m.view_count as number) ?? 0) : "0回視聴",
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
export function getRankings() {
  try {
    const episodes = getPublishedEpisodes()
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
export function getFeaturedItems() {
  try {
    const episodes = getPublishedEpisodes()
    if (episodes.length === 0) return getStaticFeaturedItems()

    // programsのロゴも取得
    const allPrograms = supabaseGet("programs?select=id,name,logo_path") as Record<string, unknown>[]
    const programLogoMap = new Map((allPrograms ?? []).map((p) => [p.name as string, (p.logo_path as string) ?? ""]))

    // 先頭5件をフィーチャードに変換
    return episodes.slice(0, 5).map((ep) => ({
      id: ep.id,
      title: ep.title,
      subtitle: ep.programName || "",
      description: ep.description,
      thumbnailUrl: ep.thumbnailUrl,
      programLogoUrl: programLogoMap.get(ep.programName) ?? "",
    }))
  } catch {
    return getStaticFeaturedItems()
  }
}

function getStaticFeaturedItems() {
  return [
    { id: "EP_14365", title: "宇宙開発の課題 \"交通整備\"は誰がする？", subtitle: "宇宙ビジネス最前線", description: "宇宙ビジネスは、ロケットや衛星だけでは成り立たない。", thumbnailUrl: "/images/static/converted/chapter/14365/ogp/14365.webp", programLogoUrl: "/images/programs/logo_banner/68f892ba65fed.svg" },
    { id: "EP_14305", title: "北朝鮮・迎撃不可能なドローン攻撃の恐怖", subtitle: "9 questions", description: "北朝鮮は「抑止」から「実行」可能な現実の脅威へ。", thumbnailUrl: "/images/static/converted/chapter/14305/ogp/14305.webp", programLogoUrl: "/images/programs/logo_banner/6789c5483cb7d.svg" },
    { id: "EP_14317", title: "Geminiで学ぶ・稼ぐ術／AI家庭教師", subtitle: "ランキング超分析", description: "ランキングを専門家と共に徹底分析。", thumbnailUrl: "/images/static/converted/chapter/14317/ogp/14317.webp", programLogoUrl: "/images/programs/logo_banner/68baf2526844c.svg" },
    { id: "EP_14325", title: "「山下本気うどん」売却までの経緯", subtitle: "MONEY SKILL SET", description: "借金1000万円から資産2.5億円を築いた芸人。", thumbnailUrl: "/images/static/converted/chapter/14325/ogp/14325.webp", programLogoUrl: "/images/programs/logo_banner/688dc66289db3.svg" },
    { id: "EP_14328", title: "5年で株価3倍。JTが稼げる理由", subtitle: "TOP TALK", description: "海外市場での成長が続くJT。", thumbnailUrl: "/images/static/converted/chapter/14328/ogp/14328.webp", programLogoUrl: "/images/programs/logo_banner/68b86024e30ae.svg" },
  ] as const
}

/** カテゴリ別新着エピソード — DB公開動画をcategory_codeでグループ化 */
export function getCategoryEpisodes() {
  try {
    const episodes = getPublishedEpisodes()
    if (episodes.length === 0) return staticCategoryEpisodes

    const categoryLabels: Record<string, string> = {
      business: "ビジネス", money: "マネー", career: "キャリア",
      life: "ライフ", technology: "テクノロジー", global: "グローバル",
    }
    const categories = Object.keys(categoryLabels)

    return categories.map((code) => {
      const filtered = episodes.filter((e) => e.categoryCode === code)
      const staticCat = staticCategoryEpisodes.find((c) => c.code === code)
      return {
        code,
        label: categoryLabels[code],
        episodes: filtered.length > 0 ? filtered : (staticCat?.episodes ?? []),
      }
    })
  } catch {
    return staticCategoryEpisodes
  }
}

/** カテゴリ別フィーチャード */
export function getCategoryFeatured() {
  return staticCategoryFeatured
}

/** プレイリスト */
export function getPlaylists() {
  return staticPlaylists
}

// ============================================================
// Programs
// ============================================================

/** 番組一覧 */
export function getPrograms(): readonly Program[] {
  try {
    const programs = supabaseGet("programs?is_active=eq.true&order=id") as Record<string, unknown>[]
    if (!Array.isArray(programs) || programs.length === 0) return staticPrograms
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
export function getVideoDetail(videoId: string): VideoDetailResult | null {
  try {
    const videos = supabaseGet(`videos?id=eq.${videoId}&limit=1`) as Record<string, unknown>[]
    if (!Array.isArray(videos) || videos.length === 0) return null
    const v = videos[0]

    // 番組名を取得
    let programName = ""
    if (v.program_id) {
      const progs = supabaseGet(`programs?id=eq.${v.program_id}&select=name&limit=1`) as Record<string, unknown>[]
      programName = (progs?.[0]?.name as string) ?? ""
    }

    const trans = supabaseGet(`transcriptions?video_id=eq.${videoId}&limit=1`) as Record<string, unknown>[]
    const transcript = trans?.[0] ?? null

    const aiArr = supabaseGet(`ai_contents?video_id=eq.${videoId}&limit=1`) as Record<string, unknown>[]
    const aiContent = aiArr?.[0] ?? null

    const metArr = supabaseGet(`metrics?video_id=eq.${videoId}&limit=1`) as Record<string, unknown>[]
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
      chapters: (aiContent?.chapters as Chapter[]) ?? null,
      article: (aiContent?.article as string) ?? null,
      tags: (aiContent?.tags as string[]) ?? null,
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
