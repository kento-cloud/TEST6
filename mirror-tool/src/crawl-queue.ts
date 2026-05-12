export interface CrawlConfig {
  readonly maxDepth: number
  readonly maxPages: number
  readonly excludePatterns: readonly string[]
}

export interface QueueEntry {
  readonly url: string
  readonly path: string
  readonly depth: number
}

export const DEFAULT_CRAWL_CONFIG: CrawlConfig = {
  maxDepth: 2,
  maxPages: 50,
  excludePatterns: ["/api/", "/feed", ".xml", ".pdf", ".zip", "/auth/"],
}

export interface CrawlQueue {
  enqueue(url: string, depth: number): boolean
  dequeue(): QueueEntry | null
  isVisited(urlPath: string): boolean
  getVisitedPaths(): readonly string[]
  size(): number
  totalVisited(): number
}

export function createCrawlQueue(
  seedUrl: string,
  siteOrigin: string,
  config: CrawlConfig = DEFAULT_CRAWL_CONFIG
): CrawlQueue {
  const queue: QueueEntry[] = []
  const visited = new Set<string>()

  const seedPath = normalizePath(new URL(seedUrl).pathname)
  queue.push({ url: seedUrl, path: seedPath, depth: 0 })
  visited.add(seedPath)

  return {
    enqueue(url: string, depth: number): boolean {
      if (depth > config.maxDepth) return false
      if (visited.size >= config.maxPages) return false

      try {
        const parsed = new URL(url)
        if (parsed.origin !== siteOrigin) return false

        const path = normalizePath(parsed.pathname)

        if (visited.has(path)) return false
        if (config.excludePatterns.some((p) => path.includes(p))) return false

        visited.add(path)
        queue.push({
          url: `${parsed.origin}${path}`,
          path,
          depth,
        })
        return true
      } catch {
        return false
      }
    },

    dequeue(): QueueEntry | null {
      return queue.shift() ?? null
    },

    isVisited(urlPath: string): boolean {
      return visited.has(normalizePath(urlPath))
    },

    getVisitedPaths(): readonly string[] {
      return [...visited]
    },

    size(): number {
      return queue.length
    },

    totalVisited(): number {
      return visited.size
    },
  }
}

function normalizePath(pathname: string): string {
  // Remove trailing slash (except root)
  const cleaned = pathname.replace(/\/+$/, "") || "/"
  return cleaned
}
