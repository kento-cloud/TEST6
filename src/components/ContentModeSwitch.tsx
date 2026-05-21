"use client"

import { useState } from "react"
import { ContentModeTab } from "@/components/ContentModeTab"
import { VideoPlayer } from "@/components/VideoPlayer"
import { YouTubePlayer } from "@/components/YouTubePlayer"
import { AudioPlayer } from "@/components/AudioPlayer"
import { ArticleView } from "@/components/ArticleView"
import type { ContentMode } from "@/components/ContentModeTab"

interface ContentModeSwitchProps {
  readonly sourceType: string
  readonly youtubeVideoId: string | null
  readonly videoSrc: string | null
  readonly thumbnailUrl: string
  readonly title: string
  readonly programName?: string
  readonly article: string | null
}

export function ContentModeSwitch({
  sourceType,
  youtubeVideoId,
  videoSrc,
  thumbnailUrl,
  title,
  programName,
  article,
}: ContentModeSwitchProps) {
  const [activeMode, setActiveMode] = useState<ContentMode>("video")

  // ローカル動画ファイルがある場合のみ音声モード有効（YouTube APIは音声のみ不可）
  const hasAudio = sourceType !== "youtube" && !!videoSrc
  const hasArticle = !!article

  return (
    <div>
      <ContentModeTab
        activeMode={activeMode}
        onModeChange={setActiveMode}
        hasAudio={hasAudio}
        hasArticle={hasArticle}
      />

      {/* 動画モード */}
      {activeMode === "video" && (
        <>
          {(sourceType === "youtube" && youtubeVideoId) || videoSrc ? (
            <div className="mb-6 -mx-4 md:-mx-8">
              <div className="w-full">
                {sourceType === "youtube" && youtubeVideoId ? (
                  <YouTubePlayer videoId={youtubeVideoId} thumbnailUrl={thumbnailUrl} />
                ) : videoSrc ? (
                  <VideoPlayer src={videoSrc} poster={thumbnailUrl} />
                ) : null}
              </div>
            </div>
          ) : (
            <div className="bg-[#1d2030] rounded-xl p-8 mb-6 flex items-center justify-center">
              <p className="text-[#606370] text-[14px]">動画ファイルが登録されていません</p>
            </div>
          )}
        </>
      )}

      {/* 音声モード */}
      {activeMode === "audio" && videoSrc && (
        <AudioPlayer
          src={videoSrc}
          thumbnailUrl={thumbnailUrl}
          title={title}
          programName={programName}
        />
      )}

      {/* 記事モード */}
      {activeMode === "article" && (
        <ArticleView article={article} title={title} />
      )}
    </div>
  )
}
