import Image from "next/image"
import Link from "next/link"

const defaultLogos = [
  { id: 48, src: "/images/programs/logo_banner/68f892ba65fed.svg" },
  { id: 2, src: "/images/programs/logo_banner/6789c5483cb7d.svg" },
  { id: 19, src: "/images/programs/logo_banner/688dc66289db3.svg" },
  { id: 76, src: "/images/programs/logo_banner/68baf2526844c.svg" },
] as const

interface ProgramMiniLogosProps {
  readonly logos?: readonly { readonly id: number; readonly src: string }[]
}

export function ProgramMiniLogos({ logos = defaultLogos }: ProgramMiniLogosProps) {
  return (
    <div className="md:hidden flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
      {logos.map((logo) => (
        <Link
          key={logo.id}
          href={`/program/${logo.id}`}
          className="shrink-0 w-[80px] h-[45px] rounded-md overflow-hidden bg-[#1d2030] flex items-center justify-center border border-[#303240]/50"
        >
          <Image
            src={logo.src}
            alt=""
            width={70}
            height={35}
            className="object-contain"
          />
        </Link>
      ))}
    </div>
  )
}
