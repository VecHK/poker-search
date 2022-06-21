import { WindowID } from '../core/layout/window'
import Storage from '../utils/storage'

const [ getStorage, setStorage ] = Storage<WindowID | null>('X-ControlWindowLaunched')

export function initControlWindowLaunched() {
  return cleanControlLaunch()
}

export async function controlIsLaunched() {
  return Boolean(await getStorage())
}

export async function getControlWindowId() {
  return getStorage()
}

export function cleanControlLaunch() {
  return setStorage(null)
}

export function setControlLaunch(id: WindowID) {
  return setStorage(id)
}
