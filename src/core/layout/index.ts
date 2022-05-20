import { timeout } from 'vait'
import { Base } from '../base'
import { constructSearchWindowsFast } from './window-create'
import { selectWindow } from './window-update'
import { closeAllWindow, SearchWindow } from './window'
import { renderCol, renderMatrix } from './render'
import { Matrix, selectCol } from '../common'
import cfg from '../../config'

export type LayoutInfo = {
  width: number
  height: number
  countPerRow: number
  searchList: Array<SearchWindow>
}

export async function createSearchLayout({
  control_window_id,
  base,
  keyword,
  canContinue,
  stop,
}: {
  control_window_id: number,
  base: Base
  keyword: string
  canContinue: () => boolean
  stop: () => void
}) {
  const { search_matrix } = base
  let matrix = await constructSearchWindowsFast(
    base, search_matrix, keyword, canContinue, stop
  )

  let __need_refresh__ = false

  async function refreshLayout(skip_ids: number[]) {
    await renderMatrix(base, matrix, true, false, skip_ids)
    await chrome.windows.update(control_window_id, { focused: true })
  }

  const handleFocusChanged = async (focused_window_id: number) => {
    const reg_ids = matrix.flat().map(u => u.windowId)
  
    const is_not_control_window = focused_window_id !== control_window_id
    const is_not_matrix_window = reg_ids.indexOf(focused_window_id) === -1
    const is_not_chrome_window = focused_window_id === chrome.windows.WINDOW_ID_NONE
    if ((is_not_control_window && is_not_matrix_window) || is_not_chrome_window) {
      __need_refresh__ = true
    } else {
      __need_refresh__ = false
      try {
        clearFocusChangedHandler()

        const [need_update, update] = selectWindow(matrix, focused_window_id)
        if (need_update) {
          await timeout(cfg.SEARCH_FOCUS_INTERVAL)
  
          const col_refresh_waiting = renderCol(base, update.new_matrix, update.col, true, true)

          if (__need_refresh__) {
            const skip_ids = selectCol(matrix, update.col).map(u => u.windowId)
            await refreshLayout([focused_window_id, ...skip_ids])
            await chrome.windows.update(focused_window_id, { focused: true })
          }

          await col_refresh_waiting

          matrix = update.new_matrix
        }
        else if (__need_refresh__) {
          await refreshLayout([focused_window_id])
          await chrome.windows.update(focused_window_id, { focused: true })
        }
      } finally {
        setFocusChangedHandler()
      }
    }
  }
  const clearFocusChangedHandler = () => chrome.windows.onFocusChanged.removeListener(handleFocusChanged)
  const setFocusChangedHandler = () => chrome.windows.onFocusChanged.addListener(handleFocusChanged)

  const handleRemovedHandler = (windowId: number) => {
    const regIds = matrix.flat().map(u => u.windowId)
    if (regIds.indexOf(windowId) !== -1) {
      clearFocusChangedHandler()
      clearRemoveHandler()
      closeAllWindow(regIds)
    }
  }
  const clearRemoveHandler = () => chrome.windows.onRemoved.removeListener(handleRemovedHandler)
  const setRemoveHandler = () => chrome.windows.onRemoved.addListener(handleRemovedHandler)

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
