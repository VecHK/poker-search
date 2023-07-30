import { DefinePreferences } from './'

type URLPattern = string
type SiteOption = {
  id: string
  icon: string | null
  name: string
  url_pattern: URLPattern
  access_mode: 'DESKTOP' | 'MOBILE' | 'MOBILE-STRONG'
}
type SiteSettingFloorID = string
type SiteSettingFloor = {
  id: SiteSettingFloorID
  name: string
  row: Array<SiteOption>
}
type SiteSettings = Array<SiteSettingFloor>

export type PreferencesV4 = DefinePreferences<4, {
  launch_poker_contextmenu: boolean

  fill_empty_window: boolean
  refocus_window: boolean

  site_settings: SiteSettings
}>
