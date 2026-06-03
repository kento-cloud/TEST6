import { NextResponse } from "next/server"
import { listTemplateMeta } from "@/lib/ai/thumbnail-templates"

export const dynamic = "force-static"

/**
 * サムネイル デザインテンプレートのメタ情報を配信（UI のテンプレ選択用）。
 * buildPrompt はサーバー専用のため含めない。
 */
export function GET() {
  return NextResponse.json(listTemplateMeta())
}
