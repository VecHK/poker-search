import cfg from '../config'
import { Matrix } from '../core/common'
import generateId from '../utils/generate-id'

import { SiteOption, SiteSettings, URLPattern, SiteSettingFloor, SiteSettingFloorID } from './versions/'
export { SiteOption, SiteSettings, URLPattern, SiteSettingFloor, SiteSettingFloorID }

export function toMatrix(s: SiteSettings): Matrix<SiteOption> {
  return s.map(u => u.row)
}

export function generateSiteSettingFloor(
  row: SiteOption[],
  name: string = cfg.DEFAULT_SITE_SETTING_FLOOR_NAME
): SiteSettingFloor {
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

export function clearMobileIdentifier(url: string) {
  const u = new URL(url)
  const usp = new URLSearchParams(u.search)

  usp.delete('MOBILE_PAGE_IDENTIFIER')

  const url_params = usp.toString()
  if (url_params.length) {
    return `${u.origin}${u.pathname}?${url_params}${u.hash}`
  } else {
    return `${u.origin}${u.pathname}${u.hash}`
  }
}
