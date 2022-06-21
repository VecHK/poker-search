import { PreferencesV2 } from './v2-type'
import { PreferencesV3 } from './v3-type'

import generateId from '../../utils/generate-id'

export function updater(v2: PreferencesV2): PreferencesV3 {
  return {
    __is_poker__: true,
    version: 3,

    launch_poker_contextmenu: true,

    site_settings: v2.site_matrix.map(row => {
      return {
        id: generateId(),
        name: '站点',
        row
      }
    }),
  }
}
