import { SiteSettingFloorID } from '../preferences'
import Storage, { StorageError } from '../utils/storage'

type IDList = SiteSettingFloorID[]

const [ getStorage, setStorage ] = Storage<IDList>('X-FilteredFloor')

export function initFilteredFloor() {
  return cleanFilteredFloor()
}

export async function getFilteredFloor(): Promise<IDList> {
  try {
    return await getStorage()
  } catch (err) {
    if (err instanceof StorageError) {
      if (err.errorType === 'NOT_FOUND') {
        await cleanFilteredFloor()
        return []
      } else {
        throw err
      }
    } else {
      throw err
    }
  }
}

export function cleanFilteredFloor() {
  return setStorage([])
}

export function saveFilteredFloor(id_list: IDList) {
  return setStorage(id_list)
}
