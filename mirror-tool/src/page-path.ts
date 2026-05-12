import { posix } from "path"

/**
 * URL パスからローカル保存先ディレクトリを算出
 * "/" -> "pages"
 * "/about" -> "pages/about"
 * "/movie/123" -> "pages/movie/123"
 */
export function urlPathToLocalDir(urlPath: string): string {
  const cleaned = urlPath.replace(/^\/+|\/+$/g, "")
  return cleaned ? `pages/${cleaned}` : "pages"
}

/**
 * URL パスからローカル HTML ファイルパスを算出
 * "/" -> "pages/index.html"
 * "/about" -> "pages/about/index.html"
 */
export function urlPathToLocalFile(urlPath: string): string {
  return `${urlPathToLocalDir(urlPath)}/index.html`
}

/**
 * あるページから別のページへの相対パスを算出
 * from: "/", to: "/about" -> "about/index.html"
 * from: "/about", to: "/" -> "../index.html"
 * from: "/movie/123", to: "/movie/456" -> "../456/index.html"
 * from: "/movie/123", to: "/about" -> "../../about/index.html"
 */
export function relativePagePath(fromUrlPath: string, toUrlPath: string): string {
  const fromDir = urlPathToLocalDir(fromUrlPath)
  const toFile = urlPathToLocalFile(toUrlPath)
  return posix.relative(fromDir, toFile)
}

/**
 * あるページからアセットディレクトリへの相対パスプレフィックスを算出
 * "/" (pages/) -> "../assets/"
 * "/about" (pages/about/) -> "../../assets/"
 * "/movie/123" (pages/movie/123/) -> "../../../assets/"
 */
export function relativeAssetsPrefix(fromUrlPath: string): string {
  const fromDir = urlPathToLocalDir(fromUrlPath)
  const rel = posix.relative(fromDir, "assets")
  return rel ? `${rel}/` : "assets/"
}
