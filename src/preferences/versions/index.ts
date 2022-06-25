import { PreferencesV1 } from './v1-type'
import { PreferencesV2 } from './v2-type'
import { PreferencesV3 } from './v3-type'
import { PreferencesV4 } from './v4-type'

// -------- 每次添加新的版本后，都得修改这块地方 --------
// -------- 隔壁 update.ts 的 updater 也要更新   --------
const CURRENT_VERSION = 4
export * from './v4-type'
export type LatestVersion = PreferencesV4
export type AllVersion = LatestVersion | PreferencesV3 | PreferencesV2 | PreferencesV1
// ------------------------------------------------------

export const checkVersion = (loaded_options: AllVersion) => {
  return CURRENT_VERSION !== loaded_options.version
}
