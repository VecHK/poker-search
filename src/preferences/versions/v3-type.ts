import { DefinePreferences } from './'

type URLPattern = string
type SiteOption = {
  id: string
  icon: string | null
  name: string
  url_pattern: URLPattern
  enable_mobile: boolean
}
type SiteSettingsRow = {
  id: string
  name: string
  row: Array<SiteOption>
}
type SiteSettings = Array<SiteSettingsRow>

export type PreferencesV3 = DefinePreferences<3, {
  launch_poker_contextmenu: boolean
  site_settings: SiteSettings
}>
