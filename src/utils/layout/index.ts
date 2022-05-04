import { Base } from '../base'
import { constructSearchWindows } from './window-create'
import { selectWindow } from './window-update'
import { closeAllWindow, SearchWindow } from './window'
import { renderCol } from './render'

function timeout(timing: number) {
  return new Promise(res => setTimeout(res, timing))
}

export type LayoutInfo = {
  width: number
  height: number
  countPerRow: number
  searchList: Array<SearchWindow>
}

export async function createSearch({
  base,
  keyword,
  canContinue,
  stop,
}: {
  base: Base
  keyword: string
  canContinue: () => boolean
  stop: () => void
}) {
  const { search_matrix } = base
  let matrix = await constructSearchWindows(
    base, search_matrix, keyword, canContinue, stop
  )

  const onFocusChangedHandler = (focused_window_id: number) => {
    if (focused_window_id !== chrome.windows.WINDOW_ID_NONE) {
      const [need_update, update_col, new_matrix] = selectWindow(matrix, focused_window_id)
      if (need_update) {
        clearFocusChangedHandler()
        timeout(300).then(function wait() {
          return renderCol(base, new_matrix, update_col, true)
        }).then(function renderDone() {
          matrix = new_matrix
          setFocusChangedHandler()
        })
      }
    }
  }
  const clearFocusChangedHandler = () => chrome.windows.onFocusChanged.removeListener(onFocusChangedHandler)
  const setFocusChangedHandler = () => chrome.windows.onFocusChanged.addListener(onFocusChangedHandler)

  const onRemovedHandler = (windowId: number) => {
    const regIds = matrix.flat().map(u => u.windowId)
    if (regIds.indexOf(windowId) !== -1) {
      clearFocusChangedHandler()
      clearRemoveHandler()
      closeAllWindow(regIds)
    }
  }
  const clearRemoveHandler = () => chrome.windows.onRemoved.removeListener(onRemovedHandler)
  const setRemoveHandler = () => chrome.windows.onRemoved.addListener(onRemovedHandler)

  return {
    stop: () => {
      const ids = matrix.flat().map(u => u.windowId)
      clearFocusChangedHandler()
      clearRemoveHandler()
      return closeAllWindow(ids)
    },
    getMatrix: () => matrix,
    setMatrix: (newMatrix: Array<Array<SearchWindow>>) => {
      matrix = newMatrix
    },
    clearFocusChangedHandler,
    setFocusChangedHandler,
    clearRemoveHandler,
    setRemoveHandler,
  } as const
}
