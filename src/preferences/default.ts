import cfg from '../config'
import { mapMatrix } from '../core/common'
import generateId from '../utils/generate-id'
import { SiteSettings, Preferences, SiteOption } from './'
import { generateSiteSettingsRow } from './site-settings'

export default function getDefaultPreferences(
  append: Partial<Preferences> = {}
): Preferences {
  return {
    __is_poker__: true,
    version: 3,
    site_settings: getDefaultSiteSettings(),
    ...append,
  }
}

function getDefaultSiteSettings(): SiteSettings {
  return mapMatrix(
    cfg.DEFAULT_SITES,
    (url_pattern) => ({
      id: generateId(),
      icon: null,
      name: '__DEFAULT_NAME__',
      enable_mobile: cfg.DEFAULT_ENABLE_MOBILE,
      url_pattern,
    })
  ).map(row => {
    return generateSiteSettingsRow(row)
  })
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
