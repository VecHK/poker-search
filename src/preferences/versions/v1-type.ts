type URLPattern = string
type SiteOption = {
  id: string
  icon: string
  name: string
  url_pattern: URLPattern
}
type SiteRow = Array<SiteOption>
type SiteMatrix = Array<SiteRow>

export type PreferencesV1 = Readonly<{
  version: 1
  site_matrix: SiteMatrix
}>
