import cfg from '../config'
import { storage } from '../utils/storage'
import getDefaultOptions from './default'

import { OptionsV1 } from './v1'
import { OptionsV2, updater as v2Updater } from './v2'
const CURRENT_VERSION = 2
export type Options = OptionsV2
export type OptionsList = OptionsV1 | OptionsV2

const checkVersion = (loaded_options: OptionsList) => {
  return CURRENT_VERSION !== loaded_options.version
}

function updateVersion(s_opts: OptionsList): Options {
  if (s_opts.version === 1) {
    const v2_opts = v2Updater(s_opts)
    return checkVersion(v2_opts) ? updateVersion(v2_opts) : v2_opts
  } else {
    // is latest version
    return s_opts
  }
}

const [
  loadStorage,
  saveStorage,
  isFoundStorage
] = storage<OptionsList>(cfg.OPTIONS_STORAGE_KEY)

export async function load(): Promise<Options> {
  if (await isFoundStorage()) {
    const options = await loadStorage()
    if (checkVersion(options)) {
      const updated_options = updateVersion(options)
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
