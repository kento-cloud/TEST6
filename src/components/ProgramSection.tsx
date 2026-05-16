"use client"

import { EpisodeSection } from "./EpisodeSection"
import type { Episode, Program } from "@/types"

interface ProgramSectionsProps {
  readonly episodes: readonly Episode[]
  readonly programs: readonly Program[]
}

/** 番組ごとのエピソードを疑似生成（実データが限られるため循環利用） */
function getProgramEpisodes(programId: number, episodes: readonly Episode[], programs: readonly Program[]): readonly Episode[] {
  const offset = programId % episodes.length
  const result: Episode[] = []
  for (let i = 0; i < 4; i++) {
    const ep = episodes[(offset + i) % episodes.length]
    result.push({ ...ep, programName: programs.find((p) => p.id === programId)?.name ?? ep.programName })
  }
  return result
}

export function ProgramSections({ episodes, programs }: ProgramSectionsProps) {
  // 番組データからセクションを生成（ハードコードなし）
  const displayPrograms = programs.slice(0, 6)

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      {displayPrograms.map((prog) => (
        <EpisodeSection
          key={prog.id}
          title={prog.name.replace(/\n/g, " ")}
          episodes={getProgramEpisodes(prog.id, episodes, programs)}
          href={`/program/${prog.id}`}
        />
      ))}
    </div>
  )
}
