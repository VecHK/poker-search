import { PreferencesV1 } from './v1-type'
import { PreferencesV2 } from './v2-type'
import { PreferencesV3 } from './v3-type'

// -------- 每次添加新的版本后，都得修改这块地方 --------
// -------- 隔壁 update.ts 的 updater 也要更新   --------
const CURRENT_VERSION = 3
export * from './v3-type'
export type LatestVersion = PreferencesV3
export type AllVersion = LatestVersion | PreferencesV2 | PreferencesV1
// ------------------------------------------------------

export const checkVersion = (loaded_options: AllVersion) => {
  return CURRENT_VERSION !== loaded_options.version
}
