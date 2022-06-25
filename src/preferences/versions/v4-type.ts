export type URLPattern = string
export type SiteOption = {
  id: string
  icon: string | null
  name: string
  url_pattern: URLPattern
  enable_mobile: boolean // deprecated
  access_mode: 'DESKTOP' | 'MOBILE' | 'MOBILE-STRONG'
}
export type SiteSettingsRow = {
  id: string
  name: string
  row: Array<SiteOption>
}
export type SiteSettings = Array<SiteSettingsRow>

export type PreferencesV4 = Readonly<{
  __is_poker__: true,
  version: 4
  launch_poker_contextmenu: boolean

  fill_empty_window: boolean
  refocus_window: boolean

  site_settings: SiteSettings
}>
