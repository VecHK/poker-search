import { timeout } from 'vait'
import { Base } from '../base'
import { constructSearchWindowsFast } from './window-create'
import { selectWindow } from './window-update'
import { closeAllWindow, SearchWindow } from './window'
import { renderCol } from './render'
import { Matrix } from '../common'
import cfg from '../../config'

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
  let matrix = await constructSearchWindowsFast(
    base, search_matrix, keyword, canContinue, stop
  )

  const onFocusChangedHandler = (focused_window_id: number) => {
    if (focused_window_id !== chrome.windows.WINDOW_ID_NONE) {
      const [need_update, update] = selectWindow(matrix, focused_window_id)
      if (need_update) {
        clearFocusChangedHandler()
        timeout(cfg.SEARCH_FOCUS_INTERVAL).then(function wait() {
          return renderCol(base, update.new_matrix, update.col, true, true)
        }).then(function renderDone() {
          matrix = update.new_matrix
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
    setMatrix: (newMatrix: Matrix<SearchWindow>) => {
      matrix = newMatrix
    },
    clearFocusChangedHandler,
    setFocusChangedHandler,
    clearRemoveHandler,
    setRemoveHandler,
  } as const
}
