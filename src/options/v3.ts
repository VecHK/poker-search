import { OptionsV2 } from './v2-type'
import { OptionsV3 } from './v3-type'

export function updater(v1_options: OptionsV2): OptionsV3 {
  return {
    __is_poker__: true,
    version: 3,
    site_matrix: v1_options.site_matrix,
  }
}
