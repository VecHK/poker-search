import { OptionsV1 } from './v1-type'
import { OptionsV2 } from './v2-type'

import { mapMatrix } from '../core/common'

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
