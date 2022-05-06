import cfg from '../config'
import { storage } from '../utils/storage'
import getDefaultOptions from './default'
import { SiteMatrix } from './site-matrix'

type OptionsVersion = 1
export type Options = Readonly<{
  version: OptionsVersion
  site_matrix: SiteMatrix
}>

const [
  loadStorage,
  saveStorage,
  isFoundStorage
] = storage<Options>(cfg.OPTIONS_STORAGE_KEY)

export async function load(): Promise<Options> {
  if (await isFoundStorage()) {
    const options = await loadStorage()
    return Object.freeze(options)
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
