import { Base, LayoutInfo } from '../base'
import { Matrix } from '../common'
import { calcRealPos } from './pos'
import { isCurrentRow } from './matrix'
import { SearchWindow } from './window'
import { Limit } from '../base/limit'
import { isWindowsOS } from '../../can-i-use'

async function resetSearchWindow(
  limit: Limit,
  layout_info: LayoutInfo,
  opts: {
    window: SearchWindow,
    focused?: boolean,
    reset_size?: boolean
    row: number
    col: number
  }
): Promise<void> {
  const [left, top] = calcRealPos(limit, layout_info, opts.row, opts.col, 1)
  // opts.window.init_height

  const { type, windowId } = opts.window
  if (type === 'EMPTY') {
    return
  } if (type === 'FILL') {
    return
  } else {
    await chrome.windows.update(windowId, {
      focused: opts.focused,
      left,
      top,
      width: opts.reset_size ? layout_info.window_width : undefined,
      height: opts.reset_size ? layout_info.window_height : undefined,
    })
    return
  }
}

export async function renderMatrix(
  platform: Base['platform'],
  limit: Limit,
  layout_info: LayoutInfo,
  matrix: Matrix<SearchWindow>,
  { preset_focused, reset_size = false, skip_ids = [] }: {
    preset_focused?: boolean,
    reset_size?: boolean
    skip_ids?: number[]
  }
) {
  const promises: Promise<void>[] = []
  for (let [row, line] of matrix.entries()) {
    for (let [col, win] of line.entries()) {
      const isLastLine = isCurrentRow(matrix, row)

      if (skip_ids.indexOf(win.windowId) !== -1) {
        promises.push(Promise.resolve(undefined))
      } else {
        const p = resetSearchWindow(limit, layout_info, {
          window: win,
          focused: (preset_focused === undefined) ? (isWindowsOS(platform) || isLastLine) : preset_focused,
          reset_size,
          row,
          col,
        })
        promises.push(p)
      }
    }
  }

  return Promise.all(promises)
}

export function renderCol(
  platform: Base['platform'],
  limit: Limit,
  layout_info: LayoutInfo,
  matrix: Matrix<SearchWindow>,
  { select_col, preset_focused, reset_size = false }: {
    select_col: number,
    preset_focused?: boolean,
    reset_size?: boolean
  }
) {
  const promises: Promise<void>[] = []
  for (let [row, line] of matrix.entries()) {
    for (let [col, win] of line.entries()) {
      if (select_col === col) {
        const isLastLine = isCurrentRow(matrix, row)
        const p = resetSearchWindow(limit, layout_info, {
          window: win,
          focused: (preset_focused === undefined) ? (isWindowsOS(platform) || isLastLine) : preset_focused,
          reset_size,
          row,
          col
        })
        promises.push(p)
      }
    }
  }

  return Promise.all(promises)
}
