/**
 * ジョブキュー操作ヘルパー
 *
 * 現在: API直実行モード — ジョブの記録のみ行う。
 * 将来: 非同期ワーカーモード — enqueue → worker polling → 実行。
 *
 * 切り替え方法:
 * 1. enqueueJob() でジョブを投入
 * 2. ワーカープロセスが dequeueJob() で取得
 * 3. 処理後に completeJob() / failJob() で更新
 *
 * API直実行モードでは、enqueueJob → completeJob を同期的に呼ぶ。
 */

import { supabase } from "./supabase"
import { ulid } from "ulid"

type JobType = "transcribe" | "generate" | "thumbnail"
type JobStatus = "pending" | "processing" | "done" | "error"

/** ジョブを投入する */
export async function enqueueJob(
  videoId: string,
  jobType: JobType,
  priority: number = 0
): Promise<string> {
  const id = ulid()
  const now = new Date().toISOString()

  await supabase.from("job_queue").insert({
    id,
    video_id: videoId,
    job_type: jobType,
    status: "pending" satisfies JobStatus,
    priority,
    attempts: 0,
    max_attempts: 3,
    created_at: now,
  })

  return id
}

/** ジョブの状態を processing に更新する */
export async function startJob(jobId: string): Promise<void> {
  await supabase.from("job_queue").update({
    status: "processing" satisfies JobStatus,
    started_at: new Date().toISOString(),
    attempts: 1, // 将来: increment
  }).eq("id", jobId)
}

/** ジョブを完了にする */
export async function completeJob(jobId: string): Promise<void> {
  await supabase.from("job_queue").update({
    status: "done" satisfies JobStatus,
    completed_at: new Date().toISOString(),
  }).eq("id", jobId)
}

/** ジョブをエラーにする */
export async function failJob(jobId: string, errorMessage: string): Promise<void> {
  await supabase.from("job_queue").update({
    status: "error" satisfies JobStatus,
    error_message: errorMessage,
    completed_at: new Date().toISOString(),
  }).eq("id", jobId)
}

/**
 * 次の未処理ジョブを取得する（将来のワーカー用）
 *
 * 将来の実装:
 * - priority DESC, created_at ASC でソート
 * - SELECT FOR UPDATE でロック（Supabase では RPC 経由）
 * - 取得と同時に status を processing に更新
 */
export async function dequeueJob(): Promise<string | null> {
  const { data } = await supabase
    .from("job_queue")
    .select("id")
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)

  return data?.[0]?.id as string ?? null
}
