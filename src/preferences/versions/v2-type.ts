type URLPattern = string
type SiteOption = {
  id: string
  icon: string | null
  name: string
  url_pattern: URLPattern
  enable_mobile: boolean
}
type SiteRow = Array<SiteOption>
type SiteMatrix = Array<SiteRow>

export type PreferencesV2 = Readonly<{
  version: 2
  site_matrix: SiteMatrix
}>
