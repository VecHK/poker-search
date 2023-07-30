import { PreferencesV1 } from './v1-type'
import { PreferencesV2 } from './v2-type'
import { PreferencesV3 } from './v3-type'
import { PreferencesV4 } from './v4-type'
import { PreferencesV5 } from './v5-type'

export type DefinePreferences<Ver, T> = Readonly<T & {
  __is_poker__: true
  version: Ver
}>

// -------- 每次添加新的版本后，都得修改这块地方 --------
// -------- 隔壁 update.ts 的 updater 也要更新   --------
export const CURRENT_PREFERENCES_VERSION = 5
export * from './v5-type'
export type LatestVersion = PreferencesV5
export type AllVersion = LatestVersion | PreferencesV4 | PreferencesV3 | PreferencesV2 | PreferencesV1
// ------------------------------------------------------

export const versionNeedUpdate = (loaded_options: AllVersion) => {
  return CURRENT_PREFERENCES_VERSION !== loaded_options.version
}
