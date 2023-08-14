import { PreferencesV4 } from './v4-type'
import { PreferencesV5 } from './v5-type'

export function updater(v4: PreferencesV4): PreferencesV5 {
  return {
    ...v4,

    version: 5,

    site_settings: v4.site_settings.map(settings_row => {
      return {
        ...settings_row,
        row: settings_row.row.map(opt => {
          return {
            ...opt,
            width_size: 1
          }
        })
      }
    }),
  }
}
