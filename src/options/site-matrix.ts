import cfg from '../config'
import { constructMatrix, randomString } from '../utils/common'

import { SiteOption, SiteMatrix, URLPattern, SiteRow } from './v2'
export { SiteOption, SiteMatrix, URLPattern, SiteRow }

export function toSearchURL(urlPattern: URLPattern, keyword: string) {
  return urlPattern.replace(cfg.KEYWORD_REPLACEHOLDER, encodeURIComponent(keyword))
}

function generateId() {
  return `${randomString(16, 0)}`
}

export function generateExampleOption(): SiteOption {
  return {
    id: generateId(),
    icon: '_DEFAULT_ICON_',
    name: '_DEFAULT_NAME_',
    url_pattern: `https://example.com?search=${cfg.KEYWORD_REPLACEHOLDER}`,
    enable_mobile: true,
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
          enable_mobile: true,
          ...search,
        }
      } else {
        return {
          id: generateId(),
          icon: '_DEFAULT_ICON_',
          name: '_DEFAULT_NAME_',
          enable_mobile: true,
          url_pattern: cfg.PLAIN_WINDOW_URL_PATTERN
        }
      }
    }
  )
}
