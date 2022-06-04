import { createMemo, Lock } from 'vait'
import { Base } from '../base'
import { constructSearchWindowsFast } from './window-create'
import { selectWindow, updateWindowById } from './window-update'
import { closeWindows, getSearchWindowTabId, getWindowId, SearchWindow } from './window'
import { renderCol, renderMatrix } from './render'
import { selectCol } from '../common'
import { ApplyChromeEvent } from '../../utils/chrome-event'
import { Signal } from './signal'
import TrustedEvents from './events'

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
  creating_signal,
  stop_creating_signal,
}: {
  control_window_id: number,
  base: Base
  keyword: string
  creating_signal: Signal<void>
  stop_creating_signal: Signal<void>
}) {
  console.log('createSearchLayout')

  const platformP = chrome.runtime.getPlatformInfo()

  const { search_matrix } = base
  const [getMatrix, setMatrix] = createMemo(
    await constructSearchWindowsFast(
      base,
      search_matrix,
      keyword,
      creating_signal,
      stop_creating_signal
    )
  )

  function getRegIds(): number[] {
    return getMatrix().flat().filter(u => u.state !== 'EMPTY').map(u => u.windowId)
  }

  async function refreshLayout(skip_ids: number[]) {
    await renderMatrix(base, getMatrix(), true, false, skip_ids)
    if (skip_ids.indexOf(control_window_id) === -1) {
      await chrome.windows.update(control_window_id, { focused: true })
    }
  }

  const [ applyAllEvent, cancelAllEvent ] = TrustedEvents({
    getRegIds,
    control_window_id,
    onRemovedWindow: async () => {
      await Promise.all(exit())
    },
    platform: await platformP,

    async onSelectSearchWindow(focused_window_id, [needRefocusingLayout]) {
      console.log('onSelectSearchWindow', focused_window_id)
      const [need_update, update] = selectWindow(getMatrix(), focused_window_id)
      if (need_update) {
        const col_refresh_waiting = renderCol(
          base, update.new_matrix, update.col, true, true
        )

        if (needRefocusingLayout()) {
          const skip_ids = selectCol(getMatrix(), update.col).map(u => u.windowId)
          await refreshLayout([focused_window_id, ...skip_ids])
          await chrome.windows.update(focused_window_id, { focused: true })
        }

        await col_refresh_waiting

        setMatrix(update.new_matrix)
      }
      else if (needRefocusingLayout()) {
        await refreshLayout([focused_window_id])
        await chrome.windows.update(focused_window_id, { focused: true })
      }
    },

    async onEnterFullscreenOrMaximized(win, [, shouldRefocusLayout]) {
      console.log('onEnterFullscreenOrMaximized', win)
      cancelAllEvent()

      const window_id = getWindowId(win)

      const tab_id = await getSearchWindowTabId(window_id)

      const [__waiting_close__, emitWindowClosed] = Lock()
      const cancelEvent = ApplyChromeEvent(chrome.windows.onRemoved, removed_id => {
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

      shouldRefocusLayout(true)
    },
  })

  const exit = () => {
    cancelAllEvent()
    return closeWindows([...getRegIds(), control_window_id])
  }

  return {
    getRegIds,

    applyAllEvent,
    cancelAllEvent,

    refreshLayout,

    exit,

    getMatrix,
    setMatrix,
  } as const
}
