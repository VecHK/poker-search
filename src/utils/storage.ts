class StorageError extends Error {
}

export function storage<S extends unknown>(STORAGE_KEY: string) {
  async function load(): Promise<S> {
    const obj = await chrome.storage.local.get([STORAGE_KEY])
    const loadedOptions = obj[STORAGE_KEY]
    if (loadedOptions === undefined) {
      throw new StorageError(`'${STORAGE_KEY}' not found in Storage`)
    } else {
      return loadedOptions as S
    }
  }

  function save(options: S): Promise<void> {
    return chrome.storage.local.set({ [STORAGE_KEY]: options })
  }

  async function isFound() {
    const obj = await chrome.storage.local.get([STORAGE_KEY])
    const loadedOptions = obj[STORAGE_KEY]
    return Boolean(loadedOptions)
  }

  return [load, save, isFound] as const
}
