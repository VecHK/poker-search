import { Memo, Lock } from 'vait'
import { Base } from '../base'
import { constructSearchWindowsFast } from './window-create'
import { selectWindow } from './window-update'
import { getSearchWindowTabURL, getWindowId, SearchWindow } from './window'
import { renderCol, renderMatrix } from './render'
import { selectCol } from '../common'
import { ApplyChromeEvent } from '../../utils/chrome-event'
import { Signal } from '../../utils/signal'
import TrustedEvents from './events'
import { clearMobileIdentifier } from '../../preferences/site-settings'
import { alarmSetTimeout } from '../../utils/chrome-alarms'

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
  onRemovedWindow,
  onRefocusLayoutClose,
}: {
  control_window_id: number,
  base: Base
  keyword: string
  creating_signal: Signal<void>
  stop_creating_signal: Signal<void>
  onRemovedWindow: () => Promise<void>
  onRefocusLayoutClose: () => Promise<void>
}) {
  console.log('createSearchLayout')

  function getRegIds(): number[] {
    return getMatrix().flat().filter(u => u.state !== 'EMPTY').map(u => u.windowId)
  }

  async function refreshLayout(skip_ids: number[]) {
    await renderMatrix(base, getMatrix(), true, false, skip_ids)
    if (skip_ids.indexOf(control_window_id) === -1) {
      await chrome.windows.update(control_window_id, { focused: true })
    }
  }

  const { search_matrix } = base
  const [getMatrix, setMatrix] = Memo(
    await constructSearchWindowsFast(
      base,
      search_matrix,
      keyword,
      creating_signal,
      stop_creating_signal
    )
  )

  const {
    applyAllEvent,
    cancelAllEvent,
    refocus_window_id,
  } = await TrustedEvents({
    getRegIds,
    control_window_id,

    limit: base.limit,
    platform: base.platform,

    onRemovedWindow,

    onRefocusLayoutClose,

    async onRefocusLayout() {
      await refreshLayout([])
      await chrome.windows.update(control_window_id, { focused: true })
    },

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

    async onClickedRevert(window_id, [, shouldRefocusLayout]) {
      console.log('onClickedRevert', window_id)

      const url_P = getSearchWindowTabURL(window_id)
      const { getRevertContainerId, setRevertContainerId } = base

      const revert_container_id = getRevertContainerId()
      if (revert_container_id !== undefined) {
        await Promise.all([
          chrome.tabs.create({
            url: clearMobileIdentifier(await url_P),
            windowId: revert_container_id
          }),
          chrome.windows.update(revert_container_id, { focused: true })
        ])
      } else {
        const new_window = await chrome.windows.create({
          url: clearMobileIdentifier(await url_P),
          state: 'normal',
          focused: true,
        })

        if (new_window.id) {
          chrome.windows.update(new_window.id, {
            focused: true,
          })
        }

        const new_window_id = getWindowId(new_window)
        setRevertContainerId(new_window_id)
        const cancelEvent = ApplyChromeEvent(chrome.windows.onRemoved, closed_id => {
          if (closed_id === new_window_id) {
            cancelEvent()
            setRevertContainerId(undefined)
          }
        })
      }

      shouldRefocusLayout(true)
    },

    async onEnterFullscreenOrMaximized(win, [, shouldRefocusLayout]) {
      console.log('onEnterFullscreenOrMaximized', win)
      cancelAllEvent()

      const window_id = getWindowId(win)

      const url_P = getSearchWindowTabURL(window_id)

      const [__waiting_bounds_changed__, emitWindowBoundsChanged] = Lock()
      const cancelEvent = ApplyChromeEvent(chrome.windows.onBoundsChanged, (win) => {
        const bounds_window_id = getWindowId(win)
        if (bounds_window_id === window_id) {
          cancelEvent()

          const clearTimer = alarmSetTimeout(1000, () => {
            clearTimer()
            const r_id = getRevertContainerId()
            if (r_id !== undefined) {
              chrome.windows.update(r_id, { focused: true })
                .finally(emitWindowBoundsChanged)
            } else {
              throw Error('r_id is undefined')
            }
          })
        }
      })

      const { getRevertContainerId, setRevertContainerId } = base
      const revert_container_id = getRevertContainerId()
      if (revert_container_id !== undefined) {
        await Promise.all([
          chrome.windows.update(window_id, {
            state: 'normal'
          }),
          chrome.tabs.create({
            url: clearMobileIdentifier(await url_P),
            windowId: revert_container_id
          }),
          chrome.windows.update(revert_container_id, { focused: true })
        ])
      } else {
        const new_window = await chrome.windows.create({
          url: clearMobileIdentifier(await url_P),
          state: 'normal',
          focused: true,
        })

        await chrome.windows.update(window_id, {
          state: 'normal',
          focused: false,
        })

        const new_window_id = getWindowId(new_window)
        setRevertContainerId(new_window_id)
        const cancelEvent = ApplyChromeEvent(chrome.windows.onRemoved, closed_id => {
          if (closed_id === new_window_id) {
            cancelEvent()
            setRevertContainerId(undefined)
          }
        })
      }

      await __waiting_bounds_changed__

      shouldRefocusLayout(true)
    },
  })

  return {
    getRegIds,

    applyAllEvent,
    cancelAllEvent,

    refreshLayout,

    refocus_window_id,

    getMatrix,
    setMatrix,
  } as const
}
