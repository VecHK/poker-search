import { Preferences } from '.'
import { Base64 } from 'js-base64'

import cfg from '../config'
import { Matrix } from '../core/common'
import generateId from '../utils/generate-id'
import getDefaultPreferences from './default'
import { updatePreferences } from './versions/update'

import { SiteOption, SiteSettings, URLPattern, SiteSettingFloor, SiteSettingFloorID, AllVersion } from './versions/'
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

export const hasStrongMobileAccessMode = (
  site_settings: Preferences['site_settings']
) => (
  site_settings.some(
    (settings) => settings.row.some(
      opt => opt.access_mode === 'MOBILE-STRONG'
    )
  )
)

export function toSearchURL(urlPattern: URLPattern, keyword: string) {
  try {
    return urlPattern
      .replace(cfg.KEYWORD_REPLACEHOLDER, encodeURIComponent(keyword))
      .replace(cfg.KEYWORD_REPLACEHOLDER_WITH_BASE64, encodeURIComponent(Base64.encode(keyword)))
  } catch (err) {
    console.warn(err)
    throw Error(`toSearchURL(${keyword}) failure: ${urlPattern}`)
  }
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

function isPokerPreferences(obj: unknown): boolean {
  if ((typeof obj === 'object') && (obj !== null)) {
    const is_poker = Reflect.get(obj, '__is_poker__')
    if (typeof(is_poker) === 'boolean') {
      return is_poker
    } else {
      return false
    }
  } else {
    return false
  }
}

function parseJson<T>(json: string) {
  try {
    return JSON.parse(json) as T
  } catch (err) {
    throw Error('JSON 解析失败')
  }
}

export function processSiteSettingsData(raw_obj: AllVersion) {
  try {
    const { site_settings } = updatePreferences(raw_obj)
    return site_settings
  } catch (err) {
    console.error(err)
    throw Error('站点配置信息读取失败')
  }
}

export function parseSiteSettingsData(raw: string): SiteSettings {
  const prefs = parseJson(raw)

  if (!isPokerPreferences(prefs)) {
    throw Error('此文件似乎不是 Poker 的站点配置文件')
  } else {
    return processSiteSettingsData(prefs as AllVersion)
  }
}

function cleanIconField(site_settings: SiteSettings): SiteSettings {
  return site_settings.map(f => ({
    ...f,
    row: f.row.map(s_opt => ({
      ...s_opt,
      icon: null
    }))
  }))
}

export function exportSiteSettingsData(site_settings: SiteSettings): string {
  const export_object: Preferences = {
    ...getDefaultPreferences(),
    site_settings: cleanIconField(site_settings),
  }
  return JSON.stringify(
    export_object,
    undefined,
    '  '
  )
}
