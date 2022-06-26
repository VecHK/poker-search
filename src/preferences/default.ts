import cfg from '../config'
import { mapMatrix } from '../core/common'
import generateId from '../utils/generate-id'
import { SiteSettings, Preferences, SiteOption } from './'
import { generateSiteSettingsRow } from './site-settings'

type AppendPreferences = Omit<
  Partial<Preferences>,
  'version' | '__is_poker__'
>

export default function getDefaultPreferences(
  append: AppendPreferences = {}
): Preferences {
  return {
    __is_poker__: true,
    version: 4,
    fill_empty_window: false,
    refocus_window: true,
    launch_poker_contextmenu: true,
    site_settings: getDefaultSiteSettings(),
    ...append,
  }
}

function getDefaultSiteSettings(): SiteSettings {
  return mapMatrix(
    cfg.DEFAULT_SITES,
    (url_pattern): SiteOption => ({
      id: generateId(),
      icon: null,
      name: '__DEFAULT_NAME__',
      url_pattern,
      access_mode: 'MOBILE'
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
    access_mode: 'MOBILE',
  }
}
