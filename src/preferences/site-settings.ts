import cfg from '../config'
import { Matrix } from '../core/common'
import generateId from '../utils/generate-id'

import { SiteOption, SiteSettings, URLPattern, SiteSettingsRow } from './versions/'
export { SiteOption, SiteSettings, URLPattern, SiteSettingsRow }

export function toMatrix(s: SiteSettings): Matrix<SiteOption> {
  return s.map(u => u.row)
}

export function generateSiteSettingsRow(
  row: SiteOption[],
  name: string = cfg.DEFAULT_SITE_OPTION_NAME
): SiteSettingsRow {
  return {
    id: generateId(),
    name,
    row,
  }
}

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
