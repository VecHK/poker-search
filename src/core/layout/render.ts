import { Base } from '../base'
import { Matrix } from '../common'
import { calcRealPos } from './pos'
import { isCurrentRow } from './matrix'
import { SearchWindow } from './window'

function refreshWindow(
  base: Base,
  opts: {
    windowId: number,
    focused?: boolean,
    resetSize?: boolean
    row: number
    col: number
  }
) {
  const [left, top] = calcRealPos(base, opts.row, opts.col)
  
  return chrome.windows.update(opts.windowId, {
    focused: opts.focused,
    left,
    top,
    width: opts.resetSize ? base.info.window_width : undefined,
    height: opts.resetSize ? base.info.window_height : undefined,
  })
}

export async function renderMatrix(
  base: Base,
  matrix: Matrix<SearchWindow>,
  presetFocused: undefined | boolean = undefined,
  resetSize: boolean = false,
  skip_ids: number[] = []
) {
  const isWin = base.platform.os === 'win'

  const promises: Promise<chrome.windows.Window | null>[] = []
  for (let [row, line] of matrix.entries()) {
    for (let [col, u] of line.entries()) {
      const isLastLine = isCurrentRow(matrix, row)

      if (skip_ids.indexOf(u.windowId) !== -1) {
        promises.push(Promise.resolve(null))
      } else {
        const p = refreshWindow(base, {
          windowId: u.windowId,
          focused: (presetFocused === undefined) ? (isWin || isLastLine) : presetFocused,
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
  base: Base,
  matrix: Matrix<SearchWindow>,
  selectCol: number,
  presetFocused: undefined | boolean = undefined,
  resetSize: boolean = false
) {
  const isWin = base.platform.os === 'win'

  const promises: Promise<chrome.windows.Window>[] = []
  for (let [row, line] of matrix.entries()) {
    for (let [col, u] of line.entries()) {
      if (selectCol === col) {
        const isLastLine = isCurrentRow(matrix, row)
        const p = refreshWindow(base, {
          windowId: u.windowId,
          focused: (presetFocused === undefined) ? (isWin || isLastLine) : presetFocused,
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
