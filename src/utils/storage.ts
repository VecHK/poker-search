const createMemo = <Data extends unknown>(data: Data) => [
  () => data,
  (newData: Data) => { data = newData }
] as const

function CreateAtomic() {
  const [ getProcessing, setProcessing ] = createMemo<Promise<unknown> | null>(null)

  return async function atomic<T>(
    task: () => Promise<T>,
  ): Promise<T> {
    const processing = getProcessing()
    if (processing !== null) {
      try {
        await processing
      } finally {
        return atomic(task)
      }
    } else {
      const new_processing = task()
      setProcessing(new_processing)
      try {
        return await new_processing
      } finally {
        setProcessing(null)
      }
    }
  }
}

export class StorageError extends Error {}

export default function Storage<Data extends unknown>(STORAGE_KEY: string) {
  const atomic = CreateAtomic()

  const load = () => atomic(async () => {
    const storage = await chrome.storage.local.get([STORAGE_KEY])
    const loadedData = storage[STORAGE_KEY]
    if (loadedData === undefined) {
      throw new StorageError(`'${STORAGE_KEY}' not found in Storage`)
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
