import { WindowID } from '../core/layout/window'
import Storage from '../utils/storage'

const [ getStorage, setStorage ] = Storage<WindowID | null>('X-ControlWindowLaunched')

export function initControlWindowLaunched() {
  return cleanControlLaunch()
}

export async function controlIsLaunched() {
  return Boolean(await getStorage())
}

export async function getControlWindowId(): Promise<number | null> {
  const control_window_id = await getStorage()
  if (control_window_id === null) {
    return null
  } else {
    if (await windowExist(control_window_id)) {
      return control_window_id
    } else {
      await cleanControlLaunch()
      return null
    }
  }
}

async function windowExist(window_id: WindowID): Promise<boolean> {
  try {
    return Boolean(await chrome.windows.get(window_id))
  } catch {
    return false
  }
}

export function cleanControlLaunch() {
  return setStorage(null)
}

export function setControlLaunch(id: WindowID) {
  return setStorage(id)
}
