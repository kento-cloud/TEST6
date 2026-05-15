import { NextRequest, NextResponse } from "next/server"
import { readFile, writeFile, copyFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { requireAdmin } from "@/lib/auth"

const ENV_PATH = path.join(process.cwd(), ".env.local")

async function readEnvFile(): Promise<Record<string, string>> {
  if (!existsSync(ENV_PATH)) return {}
  const content = await readFile(ENV_PATH, "utf-8")
  const env: Record<string, string> = {}
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIndex = trimmed.indexOf("=")
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex)
    const value = trimmed.slice(eqIndex + 1)
    env[key] = value
  }
  return env
}

async function writeEnvFile(env: Record<string, string>): Promise<void> {
  const lines = Object.entries(env).map(([k, v]) => `${k}=${v}`)
  await writeFile(ENV_PATH, lines.join("\n") + "\n", "utf-8")
}

function maskKey(value: string): string {
  if (value.length <= 11) return "****"
  return `${value.slice(0, 7)}...${value.slice(-4)}`
}

export async function GET() {
  const authError = await requireAdmin()
  if (authError) return authError

  const env = await readEnvFile()
  return NextResponse.json({
    OPENAI_API_KEY: env.OPENAI_API_KEY ? { set: true, masked: maskKey(env.OPENAI_API_KEY) } : { set: false, masked: "" },
    ADMIN_PASSWORD: env.ADMIN_PASSWORD ? { set: true, masked: "****" } : { set: false, masked: "" },
    AI_TEXT_MODEL: env.AI_TEXT_MODEL ?? "gpt-4.1",
    AI_IMAGE_MODEL: env.AI_IMAGE_MODEL ?? "gpt-image-2",
    AI_TRANSCRIBE_MODEL: env.AI_TRANSCRIBE_MODEL ?? "gpt-4o-transcribe",
  })
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  const body = await req.json() as Record<string, string>
  const env = await readEnvFile()

  const allowedKeys = [
    "OPENAI_API_KEY",
    "ADMIN_PASSWORD",
    "AI_TEXT_MODEL",
    "AI_IMAGE_MODEL",
    "AI_TRANSCRIBE_MODEL",
  ]

  for (const key of allowedKeys) {
    if (key in body && body[key] !== undefined) {
      if (body[key] === "") {
        delete env[key]
      } else {
        env[key] = body[key]
      }
    }
  }

  const BAK_PATH = ENV_PATH + ".bak"

  try {
    if (existsSync(ENV_PATH)) {
      await copyFile(ENV_PATH, BAK_PATH)
    }
  } catch {
    // Backup failed
  }

  try {
    await writeEnvFile(env)
  } catch (writeError) {
    try {
      if (existsSync(BAK_PATH)) {
        await copyFile(BAK_PATH, ENV_PATH)
      }
    } catch {
      // Restore also failed
    }
    const message = writeError instanceof Error ? writeError.message : "Unknown error"
    return NextResponse.json({ error: `設定の保存に失敗しました: ${message}` }, { status: 500 })
  }

  return NextResponse.json({ status: "ok", message: "設定を保存しました。サーバーを再起動してください。" })
}
