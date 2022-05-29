import cfg from '../config'
import InitStorage from '../utils/storage'
import getDefaultPreferences from './default'

import { AllVersion, checkVersion, LatestVersion } from './versions'
import { updatePreferences } from './versions/update'

export * from './versions/'

export type Preferences = LatestVersion

const [
  loadStorage,
  saveStorage,
  isFoundStorage
] = InitStorage<AllVersion>(cfg.PREFERENCES_STORAGE_KEY)

export async function load(): Promise<Preferences> {
  if (await isFoundStorage()) {
    const preferences = await loadStorage()
    if (checkVersion(preferences)) {
      const updated_preferences = updatePreferences(preferences)
      console.log('new', updated_preferences)
      await save(updated_preferences)
      return updated_preferences
    } else {
      return Object.freeze(preferences as Preferences)
    }
  } else {
    return init({})
  }
}

export const save = saveStorage

export async function init(append: Parameters<typeof getDefaultPreferences>[0]) {
  const default_preferences = getDefaultPreferences(append)
  await save(default_preferences)
  return load()
}
