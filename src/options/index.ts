import cfg from '../config'
import InitStorage from '../utils/storage'
import getDefaultOptions from './default'

import { AllVersion, checkVersion, LatestVersion } from './versions'
import { updateOptions } from './versions/update'

export * from './versions/'

export type Options = LatestVersion

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
