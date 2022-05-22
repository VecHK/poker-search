import { OptionsV1 } from './v1-type'
import { OptionsV2 } from './v2-type'
import { OptionsV3 } from './v3-type'

const CURRENT_VERSION = 3
export * from './v3-type'
export type LatestVersion = OptionsV3
export type AllVersion = OptionsV1 | OptionsV2 | OptionsV3

export const checkVersion = (loaded_options: AllVersion) => {
  return CURRENT_VERSION !== loaded_options.version
}
