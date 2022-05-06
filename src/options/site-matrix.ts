import cfg from '../config'
import { constructMatrix, randomString } from '../utils/common'

type URLPattern = string
export type SiteOption = {
  id: string
  icon: string
  name: string
  url_pattern: URLPattern
}
export type SiteRow = Array<SiteOption>
export type SiteMatrix = Array<SiteRow>

export function toSearchURL(urlPattern: URLPattern, keyword: string) {
  return urlPattern.replace('[[]]', encodeURIComponent(keyword))
}

function generateId() {
  return `${randomString(16, 0)}`
}

export function generateExampleOption(): SiteOption {
  return {
    id: generateId(),
    icon: '_DEFAULT_ICON_',
    name: '_DEFAULT_NAME_',
    url_pattern: 'https://example.com?search=[[]]'
  }
}

export function getDefaultSiteMatrix(): SiteMatrix {
  const maxWindowPerLine = 8
  const row = Math.ceil(cfg.PRESET_SEARCH_LIST.length / maxWindowPerLine)

  return constructMatrix(
    row,
    maxWindowPerLine,
    (row, col) => {
      const idx = (row * maxWindowPerLine) + col
      const search = cfg.PRESET_SEARCH_LIST[idx]
      if (search) {
        return {
          id: generateId(),
          icon: '_DEFAULT_ICON_',
          name: '_DEFAULT_NAME_',
          ...search,
        }
      } else {
        return {
          id: generateId(),
          icon: '_DEFAULT_ICON_',
          name: '_DEFAULT_NAME_',
          url_pattern: cfg.PLAIN_WINDOW_URL_PATTERN
        }
      }
    }
  )
}
