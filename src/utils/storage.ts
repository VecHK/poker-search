import { Atomic } from 'vait'

export type StorageErrorType = 'NOT_FOUND'

export class StorageError extends Error {
  constructor(public errorType: StorageErrorType, msg: string) {
    super(msg)
  }
}

export default function Storage<Data extends unknown>(STORAGE_KEY: string) {
  const atomic = Atomic()

  const load = () => atomic(async () => {
    const storage = await chrome.storage.local.get([STORAGE_KEY])
    const loadedData = storage[STORAGE_KEY]
    if (loadedData === undefined) {
      throw new StorageError(
        'NOT_FOUND',
        `'${STORAGE_KEY}' not found in Storage`
      )
    } else {
      return loadedData as Data
    }
  })

  const save = (data: Data) => atomic(() => {
    return chrome.storage.local.set({ [STORAGE_KEY]: data })
  })

  const isFound = () => atomic(async () => {
    const storage = await chrome.storage.local.get([STORAGE_KEY])
    const loadedData = storage[STORAGE_KEY]
    return Boolean(loadedData)
  })

  return [load, save, isFound] as const
}
