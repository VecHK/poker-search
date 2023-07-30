import { Memo, Signal } from 'vait'
import { Base, LayoutInfo } from '../base'
import { constructSearchWindowsFast } from './window-create'
import { selectWindow } from './window-update'
import { getWindowId, WindowID } from './window'
import { renderCol, renderMatrix } from './render'
import { selectCol } from '../common'

import TrustedEvents from './events'
import WindowRevert from './window-revert'

export type SearchLayout = Unpromise<ReturnType<typeof CreateSearchLayout>>

export async function CreateSearchLayout({
  control_window_id,
  base,
  layout_info,
  keyword,
  has_strong_mobile_mode,
  creating_signal,
  stop_creating_signal,
  onRemovedWindow,
  onRefocusLayoutClose,
}: {
  control_window_id: WindowID
  base: Base
  layout_info: LayoutInfo
  keyword: string
  has_strong_mobile_mode: boolean
  creating_signal: Signal<void>
  stop_creating_signal: Signal<void>
  onRemovedWindow: () => Promise<void>
  onRefocusLayoutClose: () => Promise<void>
}) {
  console.log('CreateSearchLayout')

  function getRegIds(): number[] {
    return getMatrix().flat().filter(u => u.state !== 'EMPTY').map(u => u.windowId)
  }

  async function refreshLayout(skip_ids: number[]) {
    await renderMatrix(base, layout_info, getMatrix(), true, false, skip_ids)
    if (skip_ids.indexOf(control_window_id) === -1) {
      await chrome.windows.update(control_window_id, { focused: true })
    }
  }

  const { search_matrix } = layout_info
  const [getMatrix, setMatrix] = Memo(
    await constructSearchWindowsFast(
      base,
      layout_info,
      search_matrix,
      keyword,
      creating_signal,
      stop_creating_signal
    )
  )

  const revertWindow = WindowRevert(base)

  const {
    applyAllEvent,
    cancelAllEvent,
    refocus_window_id,
  } = await TrustedEvents({
    getRegIds,
    control_window_id,
    base,
    has_strong_mobile_mode,

    onRemovedWindow,

    onRefocusLayoutClose,

    async onSelectSearchWindow(focused_window_id, [needRefocusingLayout]) {
      console.log('onSelectSearchWindow', focused_window_id)
      const [need_update, update] = selectWindow(getMatrix(), focused_window_id)
      if (need_update) {
        const col_refresh_waiting = renderCol(
          base, layout_info, update.new_matrix, update.col, true, true
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

    async onEnterMinimized(win_list, [, shouldRefocusLayout]) {
      console.log('onEnterMinimized')

      await Promise.all(
        win_list.map(win => {
          return revertWindow(getWindowId(win))
        })
      )

      shouldRefocusLayout(true)
    },

    async onEnterMaximized(win, [, shouldRefocusLayout]) {
      console.log('onEnterMaximized', win)

      await revertWindow(getWindowId(win))

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
