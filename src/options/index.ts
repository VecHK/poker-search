import cfg from '../config'
import InitStorage from '../utils/storage'
import getDefaultOptions from './default'

import { OptionsV1 } from './v1-type'
import { OptionsV2 } from './v2-type'
import { OptionsV3 } from './v3-type'

import { updater as v2Updater } from './v2'
import { updater as v3Updater } from './v3'

export type AllVersion = OptionsV1 | OptionsV2 | OptionsV3

export * from './v3-type'
const CURRENT_VERSION = 3
export type LatestVersion = OptionsV3
export type Options = LatestVersion

export function updateOptions(s_opts: AllVersion): LatestVersion {
  switch (s_opts.version) {
    case 1:
      return updateOptions(v2Updater(s_opts))

    case 2:
      return updateOptions(v3Updater(s_opts))

    default:
      return s_opts
  }
}

const checkVersion = (loaded_options: AllVersion) => {
  return CURRENT_VERSION !== loaded_options.version
}

const [
  loadStorage,
  saveStorage,
  isFoundStorage
] = InitStorage<AllVersion>(cfg.OPTIONS_STORAGE_KEY)

export async function load(): Promise<Options> {
  if (await isFoundStorage()) {
    const options = await loadStorage()
    if (checkVersion(options)) {
      const updated_options = updateOptions(options)
      console.log('new', updated_options)
      await save(updated_options)
      return updated_options
    } else {
      return Object.freeze(options as Options)
    }
  } else {
    return init({})
  }
}

export const save = saveStorage

export async function init(append: Partial<Options>) {
  const default_options = getDefaultOptions(append)
  await save(default_options)
  return load()
}
