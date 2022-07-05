import cfg from '../config'
import InitStorage from '../utils/storage'
import getDefaultPreferences from './default'
import checkPreferences from './check'

import { AllVersion, checkVersion, CURRENT_PREFERENCES_VERSION, LatestVersion } from './versions'
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

export async function save(preferences: AllVersion) {
  if (preferences.version !== CURRENT_PREFERENCES_VERSION) {
    console.warn('save Preferences failure: ', 'cannot save old version preferences')
  } else {
    const result = checkPreferences(preferences)
    if (result) {
      throw Error(result)
    } else {
      return saveStorage(preferences)
    }
  }
}

export async function init(append: Parameters<typeof getDefaultPreferences>[0]) {
  const default_preferences = getDefaultPreferences(append)
  await save(default_preferences)
  return load()
}
