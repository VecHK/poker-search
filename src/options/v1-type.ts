type URLPattern = string
export type SiteOption = {
  id: string
  icon: string
  name: string
  url_pattern: URLPattern
}
export type SiteRow = Array<SiteOption>
export type SiteMatrix = Array<SiteRow>

export type OptionsV1 = Readonly<{
  version: 1
  site_matrix: SiteMatrix
}>
