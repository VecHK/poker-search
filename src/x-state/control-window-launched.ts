import Storage from '../utils/storage'

const [ getStorage, setStorage ] = Storage<boolean>('Sync-ControlWindowLaunched')

export function initControlWindowLaunched() {
  return setControlLaunch(false)
}

export function controlIsLaunched() {
  return getStorage()
}

export function setControlLaunch(val: boolean) {
  return setStorage(val)
}
