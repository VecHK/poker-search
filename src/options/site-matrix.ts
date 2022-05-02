import { createPlainMatrix, MapMatrix } from "../utils/layout/matrix"

export type SiteOption = {
  icon: string
  name: string
  url_pattern: string
}

export type Site = SiteOption | null
export type SiteRow = Array<Site>
export type SiteMatrix = Array<SiteRow>

const trueOrFalse = () => Math.round(Math.random())
const backCode = () => 65 + Math.round(Math.random() * 25)
const randomChar = (lower = 0) => String.fromCharCode(backCode() + (lower && 32))
const randomString = (length: number, lower = 0): string => randomChar(lower && trueOrFalse()) + (--length ? randomString(length, lower) : '');

const { id: chrome_id } = chrome.runtime
const randomUrlPattern = () => `http://localhost:2070/${randomString(16, 1)}[[]]&${chrome_id}`

const DefaultSearchList = [
  { url_pattern: `https://mobile.twitter.com/search?q=[[]]&src=typeahead_click&${chrome_id}` },
  { url_pattern: `https://www.google.com/search?q=[[]]&${chrome_id}` },
  { url_pattern: `https://pache.blog/tag/[[]]?${chrome_id}` },
  { url_pattern: `https://www.vgtime.com/search/list.jhtml?keyword=[[]]#${chrome_id}` },
  { url_pattern: `https://www.zhihu.com/search?type=content&q=[[]]&${chrome_id}` },
  { url_pattern: randomUrlPattern() },
  { url_pattern: randomUrlPattern() },
  { url_pattern: randomUrlPattern() },
  { url_pattern: randomUrlPattern() },
  { url_pattern: randomUrlPattern() },
  { url_pattern: randomUrlPattern() },
  { url_pattern: randomUrlPattern() },
  { url_pattern: randomUrlPattern() },
  { url_pattern: randomUrlPattern() },
  { url_pattern: randomUrlPattern() },
]

export function getDefaultSiteMatrix(): SiteMatrix {
  const maxWindowPerLine = 8
  const plainMatrix = createPlainMatrix(DefaultSearchList.length, maxWindowPerLine)

  return MapMatrix(plainMatrix, (u, row, col) => {
    const idx = (row * maxWindowPerLine) + col
    const search = DefaultSearchList[idx]
    if (search) {
      return {
        icon: '_DEFAULT_ICON_',
        name: '_DEFAULT_NAME_',
        ...search,
      }
    } else {
      return null
    }
  })
}
