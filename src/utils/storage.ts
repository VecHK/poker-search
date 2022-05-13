class StorageError extends Error {
}

export function storage<Data extends unknown>(STORAGE_KEY: string) {
  async function load(): Promise<Data> {
    const obj = await chrome.storage.local.get([STORAGE_KEY])
    const loadedData = obj[STORAGE_KEY]
    if (loadedData === undefined) {
      throw new StorageError(`'${STORAGE_KEY}' not found in Storage`)
    } else {
      return loadedData as Data
    }
  }

  let SAVING: Promise<void> | null = null
  let SAVE_QUEUE: Array<() => Promise<void>> = []
  async function executeSave(
    saveTask: () => Promise<void>,
  ): Promise<void> {
    if (!SAVING) {
      SAVING = saveTask()
      return SAVING
    } else {
      SAVE_QUEUE = [...SAVE_QUEUE, saveTask]
      return SAVING.finally(() => {
        SAVING = null
        const [nowSaveTask, ...remainTask] = SAVE_QUEUE
        if (nowSaveTask) {
          SAVE_QUEUE = remainTask
          return executeSave(nowSaveTask)
        } else {
          SAVE_QUEUE = []
        }
      })
    }
  }

  function save(data: Data): Promise<void> {
    return executeSave(
      () => chrome.storage.local.set({ [STORAGE_KEY]: data })
    )
  }

  async function isFound() {
    const storage = await chrome.storage.local.get([STORAGE_KEY])
    const loadedData = storage[STORAGE_KEY]
    return Boolean(loadedData)
  }

  return [load, save, isFound] as const
}
