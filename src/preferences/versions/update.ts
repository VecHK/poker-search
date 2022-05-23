import { AllVersion, LatestVersion } from '.'
import { updater as v2Updater } from './v2'
import { updater as v3Updater } from './v3'

// -------- 每次添加新的版本后，都得修改这块地方 --------
// -------- 隔壁 index.ts 也要更新               --------
export function updatePreferences(s_opts: AllVersion): LatestVersion {
  switch (s_opts.version) {
    case 1:
      return updatePreferences(v2Updater(s_opts))

    case 2:
      return updatePreferences(v3Updater(s_opts))

    default:
      return s_opts
  }
}
