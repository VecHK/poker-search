export type URLPattern = string
export type SiteOption = {
  id: string
  icon: string | null
  name: string
  url_pattern: URLPattern
  enable_mobile: boolean
}
export type SiteSettingsRow = {
  id: string
  name: string
  row: Array<SiteOption>
}
export type SiteSettings = Array<SiteSettingsRow>

export type PreferencesV3 = Readonly<{
  __is_poker__: true,
  version: 3
  site_settings: SiteSettings
}>
