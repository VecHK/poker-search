export type SearchWindow = Readonly<{
  windowId: number
}>
export type SearchWindowRow = Array<SearchWindow>
export type SearchWindowMatrix = Array<SearchWindowRow>

export const closeAllWindow = (ids: number[]) => {
  return ids.map(windowId => {
    return chrome.windows.remove(windowId)
  })
}
