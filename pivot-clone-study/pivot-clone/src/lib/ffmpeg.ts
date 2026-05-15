import { execFile } from "child_process"
import { promisify } from "util"

const execFileAsync = promisify(execFile)

export async function extractAudio(videoPath: string, outputPath: string): Promise<void> {
  await execFileAsync("ffmpeg", [
    "-i", videoPath,
    "-vn",
    "-ar", "16000",
    "-ac", "1",
    "-b:a", "64k",
    "-y",
    outputPath,
  ])
}

export async function extractThumbnail(videoPath: string, outputPath: string): Promise<void> {
  await execFileAsync("ffmpeg", [
    "-i", videoPath,
    "-ss", "00:00:05",
    "-frames:v", "1",
    "-q:v", "2",
    "-y",
    outputPath,
  ])
}

export async function getVideoDuration(videoPath: string): Promise<number> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "quiet",
    "-show_entries", "format=duration",
    "-of", "csv=p=0",
    videoPath,
  ])
  return Math.round(parseFloat(stdout.trim()))
}

export async function checkFfmpeg(): Promise<boolean> {
  try {
    await execFileAsync("ffmpeg", ["-version"])
    return true
  } catch {
    return false
  }
}
