import cfg from '../config'
import randomString from '../utils/random-string'

import { SiteOption, SiteMatrix, URLPattern, SiteRow } from './versions/'
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

export function generateId() {
  return `${randomString(16, 0)}`
}
