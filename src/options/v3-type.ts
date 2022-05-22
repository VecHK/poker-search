export type URLPattern = string
export type SiteOption = {
  id: string
  icon: string | null
  name: string
  url_pattern: URLPattern
  enable_mobile: boolean
}
export type SiteRow = Array<SiteOption>
export type SiteMatrix = Array<SiteRow>

export type OptionsV3 = Readonly<{
  __is_poker__: true,
  version: 3
  site_matrix: SiteMatrix
}>
