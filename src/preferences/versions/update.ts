import { AllVersion, LatestVersion } from '.'
import { updater as v2Updater } from './v2'
import { updater as v3Updater } from './v3'
import { updater as v4Updater } from './v4'
import { updater as v5Updater } from './v5'

// -------- 每次添加新的版本后，都得修改这块地方 --------
// -------- 隔壁 index.ts 也要更新               --------
export function updatePreferences(p: AllVersion): LatestVersion {
  switch (p.version) {
    case 1: return updatePreferences(v2Updater(p))
    case 2: return updatePreferences(v3Updater(p))
    case 3: return updatePreferences(v4Updater(p))
    case 4: return updatePreferences(v5Updater(p))
  }
  return p
}
