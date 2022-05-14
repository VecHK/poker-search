import { nth } from 'ramda'
import cfg from '../config'
import { constructMatrix, randomString } from '../utils/common'
import getIcon from '../utils/get-icon'

import { SiteOption, SiteMatrix, URLPattern, SiteRow } from './v2-type'
export { SiteOption, SiteMatrix, URLPattern, SiteRow }

export function toSearchURL(urlPattern: URLPattern, keyword: string) {
  return urlPattern.replace(cfg.KEYWORD_REPLACEHOLDER, encodeURIComponent(keyword))
}

export function addMobileIdentifier(url: string) {
  const u = new URL(url)
  let { search } = u
  if (search.length) {
    search += `&MOBILE_PAGE_IDENTIFIER=${cfg.MOBILE_PAGE_IDENTIFIER}`
  } else {
    search = `?MOBILE_PAGE_IDENTIFIER=${cfg.MOBILE_PAGE_IDENTIFIER}`
  }

  return `${u.origin}${u.pathname}${search}${u.hash}`
}

function generateId() {
  return `${randomString(16, 0)}`
}

export function generateExampleOption(): SiteOption {
  return {
    id: generateId(),
    icon: cfg.DEFAULT_SITE_ICON,
    name: '_DEFAULT_NAME_',
    url_pattern: `https://example.com?search=${cfg.KEYWORD_REPLACEHOLDER}`,
    enable_mobile: cfg.DEFAULT_ENABLE_MOBILE,
  }
}

export function getDefaultSiteMatrix(): SiteMatrix {
  const maxWindowPerLine = cfg.DEFAULT_MAX_WINDOW_PER_LINE
  const row = Math.ceil(cfg.DEFAULT_SEARCH_LIST.length / maxWindowPerLine)

  return constructMatrix(
    row,
    maxWindowPerLine,
    (row, col) => {
      const idx = (row * maxWindowPerLine) + col
      const url_pattern = nth(idx, cfg.DEFAULT_SEARCH_LIST)
      if (url_pattern) {
        return {
          id: generateId(),
          icon: null,
          name: '_DEFAULT_NAME_',
          enable_mobile: cfg.DEFAULT_ENABLE_MOBILE,
          url_pattern,
        }
      } else {
        return {
          id: generateId(),
          icon: null,
          name: '_DEFAULT_NAME_',
          enable_mobile: cfg.DEFAULT_ENABLE_MOBILE,
          url_pattern: cfg.PLAIN_SEARCH_WINDOW_URL_PATTERN
        }
      }
    }
  )
}
