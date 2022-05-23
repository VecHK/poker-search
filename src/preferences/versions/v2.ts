import { PreferencesV1 } from './v1-type'
import { PreferencesV2 } from './v2-type'

import { mapMatrix } from '../../core/common'

export function updater(v1: PreferencesV1): PreferencesV2 {
  return {
    version: 2,
    site_matrix: mapMatrix(v1.site_matrix, (u) => {
      return {
        ...u,
        enable_mobile: true
      }
    }),
  }
}
