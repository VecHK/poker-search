import { remove } from 'ramda'
import { Preferences } from './'

export default function checkPreferences(preferences: Preferences): false | string {
  if (!preferences.__is_poker__) {
    return 'preferences is not poker Preferences'
  }

  const setting_ids = preferences.site_settings.map(s => s.id)
  const has_duplicate_setting_id = listDuplicate(setting_ids)

  if (has_duplicate_setting_id) {
    return 'duplicate Id in site_settings'
  }

  const setting_row_ids = preferences.site_settings.map(s => s.row.map(s => s.id)).flat()
  const has_duplicate_row_id = listDuplicate(setting_row_ids)
  if (has_duplicate_row_id) {
    return 'duplicate Id in site_settings_row'
  }

  return false
}

function listDuplicate<T>(list: T[]): boolean {
  return list.some((id, idx) => {
    const remain_list = remove(idx, 1, list)
    return remain_list.indexOf(id) !== -1
  }, 0)
}
