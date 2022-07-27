import { thunkify } from 'ramda'
import cfg from '../config'
import generateId from '../utils/generate-id'
import { AllVersion, Preferences, SiteOption } from './'
import { processSiteSettingsData } from './site-settings'

import default_site_settings_data from '../config/default_site_settings.json'
const getDefaultSiteSettings = thunkify(processSiteSettingsData)(
  default_site_settings_data as AllVersion
)

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
    fill_empty_window: true,
    refocus_window: false,
    launch_poker_contextmenu: true,
    site_settings: getDefaultSiteSettings(),
    ...append,
  }
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
