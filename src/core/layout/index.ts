import { Lock, nextTick, timeout } from 'vait'
import { Base } from '../base'
import { constructSearchWindowsFast } from './window-create'
import { selectWindow, updateWindowById } from './window-update'
import { closeAllWindow, getSearchWindowTabId, getWindowId, SearchWindow } from './window'
import { renderCol, renderMatrix } from './render'
import { Matrix, selectCol } from '../common'
import cfg from '../../config'
import { nth } from 'ramda'

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
  function getRegIds(): number[] {
    return matrix.flat().map(u => u.windowId)
  }

  let __need_refresh__ = false

  async function refreshLayout(skip_ids: number[]) {
    await renderMatrix(base, matrix, true, false, skip_ids)
    await chrome.windows.update(control_window_id, { focused: true })
  }

  const handleBoundsChange = async (win: chrome.windows.Window) => {
    try {
      clearFocusChangedHandler()
      clearRemoveHandler()

      const window_id = getWindowId(win)

      const is_matrix_window = getRegIds().indexOf(window_id) !== -1
      const trigger = 
        win.state === 'fullscreen' ||
        win.state === 'maximized'

      if (is_matrix_window && trigger) {
        const tab_id = await getSearchWindowTabId(window_id)

        const [__waiting_close__, emitWindowClosed] = Lock()
        chrome.windows.onRemoved.addListener((removed_id) => {
          if (removed_id === window_id) {
            emitWindowClosed()
          }
        })

        await chrome.windows.create({ tabId: tab_id })

        matrix = updateWindowById(matrix, window_id, { state: 'EMPTY' })

        await __waiting_close__
      }
    } finally {
      setFocusChangedHandler()
      setRemoveHandler()
    }
  }
  const clearBoundsChangedHandler = () => chrome.windows.onBoundsChanged.removeListener(handleBoundsChange)
  const setBoundsChangedHandler = () => chrome.windows.onBoundsChanged.addListener(handleBoundsChange)

  const handleFocusChanged = async (focused_window_id: number) => {
    const is_not_control_window = focused_window_id !== control_window_id
    const is_not_search_window = getRegIds().indexOf(focused_window_id) === -1
    const focused_is_not_chrome = focused_window_id === chrome.windows.WINDOW_ID_NONE
    if ((is_not_control_window && is_not_search_window) || focused_is_not_chrome) {
      __need_refresh__ = true
    } else {
      try {
        clearFocusChangedHandler()

        const [need_update, update] = selectWindow(matrix, focused_window_id)
        if (need_update) {
          await timeout(cfg.SEARCH_FOCUS_INTERVAL)
  
          const col_refresh_waiting = renderCol(
            base, update.new_matrix, update.col, true, true
          )

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
        __need_refresh__ = false
        setFocusChangedHandler()
      }
    }
  }
  const clearFocusChangedHandler = () => chrome.windows.onFocusChanged.removeListener(handleFocusChanged)
  const setFocusChangedHandler = () => chrome.windows.onFocusChanged.addListener(handleFocusChanged)

  const handleRemovedHandler = (windowId: number) => {
    const regIds = matrix.flat().map(u => u.windowId)
    if (regIds.indexOf(windowId) !== -1) {
      clearRemoveHandler()
      clearFocusChangedHandler()
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

    clearBoundsChangedHandler,
    setBoundsChangedHandler,

    handleFocusChanged,
    clearFocusChangedHandler,
    setFocusChangedHandler,

    clearRemoveHandler,
    setRemoveHandler,
  } as const
}
