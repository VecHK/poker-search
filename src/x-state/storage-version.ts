import Storage, { StorageError } from '../utils/storage'
import pkg from '../../package.json'
const [ _getStorageVersion, setStorageVersion ] = Storage<string>('X-StorageVersion')

export async function getStorageVersion(): Promise<string> {
  try {
    return await _getStorageVersion()
  } catch (err) {
    if (err instanceof StorageError) {
      if (err.errorType === 'NOT_FOUND') {
        await initStorageVersion()
        return pkg.version
      } else {
        throw err
      }
    } else {
      throw err
    }
  }
}

function initStorageVersion() {
  return setStorageVersion(pkg.version)
}

export function saveStorageVersion(v: string) {
  return setStorageVersion(v)
}
