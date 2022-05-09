import { mapMatrix } from '../utils/common'

import { OptionsV1 } from './v1'

export type URLPattern = string
export type SiteOption = {
  id: string
  icon: string
  name: string
  url_pattern: URLPattern
  enable_mobile: boolean
}
export type SiteRow = Array<SiteOption>
export type SiteMatrix = Array<SiteRow>

export type OptionsV2 = Readonly<{
  version: 2
  site_matrix: SiteMatrix
}>

export function updater(v1_options: OptionsV1): OptionsV2 {
  return {
    version: 2,
    site_matrix: mapMatrix(v1_options.site_matrix, (u) => {
      return {
        ...u,
        enable_mobile: true
      }
    }),
  }
}
