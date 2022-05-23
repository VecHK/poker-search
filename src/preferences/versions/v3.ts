import { PreferencesV2 } from './v2-type'
import { PreferencesV3 } from './v3-type'

export function updater(v2: PreferencesV2): PreferencesV3 {
  return {
    __is_poker__: true,
    version: 3,
    site_matrix: v2.site_matrix,
  }
}
