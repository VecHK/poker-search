import { prop } from 'ramda'
import cfg from '../config'
import InitStorage from '../utils/storage'
import getDefaultPreferences from './default'
import checkPreferences from './check'

import { AllVersion, versionNeedUpdate, CURRENT_PREFERENCES_VERSION, LatestVersion } from './versions'
import { updatePreferences } from './versions/update'
import { saveFilteredFloor } from '../x-state/filtered-floor'

export * from './versions/'

export type Preferences = LatestVersion

const [
  loadStorage,
  saveStorage,
  isFoundStorage
] = InitStorage<AllVersion>(cfg.PREFERENCES_STORAGE_KEY)

async function initPreferences() {
  const default_preferences = getDefaultPreferences()

  await save(default_preferences)

  await saveFilteredFloor(
    default_preferences.site_settings
      .filter((f, idx) => idx !== 0)
      .map(prop('id'))
  )
}

export async function load(): Promise<Preferences> {
  if (await isFoundStorage()) {
    const preferences = await loadStorage()
    if (versionNeedUpdate(preferences)) {
      const updated_preferences = updatePreferences(preferences)
      console.log('new', updated_preferences)
      await save(updated_preferences)
      return updated_preferences
    } else {
      return Object.freeze(preferences as Preferences)
    }
  } else {
    await initPreferences()
    return load()
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
