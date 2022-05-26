import { createMemo, Lock, nextTick, timeout } from 'vait'
import { Base } from '../base'
import { constructSearchWindowsFast } from './window-create'
import { selectWindow, updateWindowById } from './window-update'
import { closeWindows, getSearchWindowTabId, getWindowId, SearchWindow } from './window'
import { renderCol, renderMatrix } from './render'
import { Matrix, selectCol } from '../common'
import cfg from '../../config'
import AddChromeEvent from '../../utils/chrome-event'

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
  const [getMatrix, setMatrix] = createMemo(
    await constructSearchWindowsFast(
      base, search_matrix, keyword, canContinue, stop
    )
  )

  function getRegIds(): number[] {
    return getMatrix().flat().map(u => u.windowId)
  }

  let __need_refocus__ = false

  async function refreshLayout(skip_ids: number[]) {
    await renderMatrix(base, getMatrix(), true, false, skip_ids)
    await chrome.windows.update(control_window_id, { focused: true })
  }

  let __bounds_processing__ = false
  const handleBoundsChange = async (win: chrome.windows.Window) => {
    console.log('handleBoundsChange')
    try {
      __bounds_processing__ = true
      disableAllEvent()

      const window_id = getWindowId(win)

      const is_matrix_window = getRegIds().indexOf(window_id) !== -1
      const trigger = 
        win.state === 'fullscreen' ||
        win.state === 'maximized'

      if (is_matrix_window && trigger) {
        __need_refocus__ = true

        const tab_id = await getSearchWindowTabId(window_id)

        const [__waiting_close__, emitWindowClosed] = Lock()
        const cancelEvent = AddChromeEvent(chrome.windows.onRemoved, removed_id => {
          if (removed_id === window_id) {
            cancelEvent()
            emitWindowClosed()
          }
        })

        const { getRevertContainerId, setRevertContainerId } = base
        const revert_container_id = getRevertContainerId()
        if (revert_container_id !== undefined) {
          await chrome.tabs.move([tab_id], {
            windowId: revert_container_id,
            index: -1
          })
          await chrome.tabs.update(tab_id, {
            active: true
          })
          await chrome.windows.update(revert_container_id, { focused: true })
        } else {
          const new_window = await chrome.windows.create({ tabId: tab_id, focused: true })
          setRevertContainerId(new_window.id)
        }

        setMatrix(
          updateWindowById(getMatrix(), window_id, { state: 'EMPTY' })
        )

        await __waiting_close__
      }
    } finally {
      enableAllEvent()
      __bounds_processing__ = false
    }
  }
  const clearBoundsChangedHandler = () => chrome.windows.onBoundsChanged.removeListener(handleBoundsChange)
  const setBoundsChangedHandler = () => chrome.windows.onBoundsChanged.addListener(handleBoundsChange)

  const handleFocusChanged = async (focused_window_id: number) => {
    console.log('handleFocusChanged')
    const is_not_control_window = focused_window_id !== control_window_id
    const is_not_search_window = getRegIds().indexOf(focused_window_id) === -1
    const focused_is_not_chrome = focused_window_id === chrome.windows.WINDOW_ID_NONE
    if ((is_not_control_window && is_not_search_window) || focused_is_not_chrome) {
      __need_refocus__ = true
    } else {
      try {
        clearFocusChangedHandler()
        await nextTick()
        if (__bounds_processing__ === true) {
          // focus 事件会先于 bounds 触发
          // 在窗口失焦的时候，点击最大化或全屏按钮后，会先触发 focus 事件，如果这时
          // 不做特殊处理的话，就会无法正确执行bounds 事件的处理了，也就无法做到变为
          // 普通窗口的功能了。故在这块地方是需要 nextTick 等到下一个 tick 后，再来
          // 查看到底触发的是不是 bounds 事件，是的话 focus 的后续操作都不需要了
          return
        }

        const [need_update, update] = selectWindow(getMatrix(), focused_window_id)
        if (need_update) {
          await timeout(cfg.SEARCH_FOCUS_INTERVAL)
  
          const col_refresh_waiting = renderCol(
            base, update.new_matrix, update.col, true, true
          )

          if (__need_refocus__) {
            const skip_ids = selectCol(getMatrix(), update.col).map(u => u.windowId)
            await refreshLayout([focused_window_id, ...skip_ids])
            await chrome.windows.update(focused_window_id, { focused: true })
          }

          await col_refresh_waiting

          setMatrix(update.new_matrix)
        }
        else if (__need_refocus__) {
          await refreshLayout([focused_window_id])
          await chrome.windows.update(focused_window_id, { focused: true })
        }
      } finally {
        __need_refocus__ = false
        setFocusChangedHandler()
      }
    }
  }
  const clearFocusChangedHandler = () => chrome.windows.onFocusChanged.removeListener(handleFocusChanged)
  const setFocusChangedHandler = () => chrome.windows.onFocusChanged.addListener(handleFocusChanged)

  const handleRemovedHandler = (windowId: number) => {
    console.log('handleRemovedHandler')
    const regIds = getRegIds()
    const is_search_window = regIds.indexOf(windowId) !== -1
    const is_control_window = control_window_id === windowId
    if (is_search_window || is_control_window) {
      exit()
    }
  }
  const clearRemoveHandler = () => chrome.windows.onRemoved.removeListener(handleRemovedHandler)
  const setRemoveHandler = () => chrome.windows.onRemoved.addListener(handleRemovedHandler)

  const disableAllEvent = () => {
    clearBoundsChangedHandler()
    clearFocusChangedHandler()
    clearRemoveHandler()
  }

  const enableAllEvent = () => {
    setBoundsChangedHandler()
    setFocusChangedHandler()
    setRemoveHandler()
  }

  const exit = () => {
    disableAllEvent()
    closeWindows([...getRegIds(), control_window_id])
  }

  return {
    getRegIds,

    disableAllEvent,
    enableAllEvent,

    exit,

    getMatrix,
    setMatrix,

    clearBoundsChangedHandler,
    setBoundsChangedHandler,

    handleFocusChanged,
    clearFocusChangedHandler,
    setFocusChangedHandler,

    clearRemoveHandler,
    setRemoveHandler,
  } as const
}
