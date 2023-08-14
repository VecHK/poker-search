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
    resetSize?: boolean
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
      width: opts.resetSize ? layout_info.window_width : undefined,
      height: opts.resetSize ? layout_info.window_height : undefined,
    })
    return
  }
}

export async function renderMatrix(
  platform: Base['platform'],
  limit: Limit,
  layout_info: LayoutInfo,
  matrix: Matrix<SearchWindow>,
  presetFocused: undefined | boolean = undefined,
  resetSize: boolean = false,
  skip_ids: number[] = []
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
          focused: (presetFocused === undefined) ? (isWindowsOS(platform) || isLastLine) : presetFocused,
          resetSize,
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
  selectCol: number,
  presetFocused: undefined | boolean = undefined,
  resetSize: boolean = false
) {
  const promises: Promise<void>[] = []
  for (let [row, line] of matrix.entries()) {
    for (let [col, win] of line.entries()) {
      if (selectCol === col) {
        const isLastLine = isCurrentRow(matrix, row)
        const p = resetSearchWindow(limit, layout_info, {
          window: win,
          focused: (presetFocused === undefined) ? (isWindowsOS(platform) || isLastLine) : presetFocused,
          resetSize,
          row,
          col
        })
        promises.push(p)
      }
    }
  }

  return Promise.all(promises)
}
