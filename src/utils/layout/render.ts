import { Base } from '../base'
import { Matrix } from '../common'
import { calcLayoutPos } from '../pos'
import { isCurrentRow } from './matrix'
import { SearchWindow } from './window'

function renderWindow(
  base: Base,
  opts: {
    windowId: number,
    focused?: boolean,
    row: number
    col: number
  }
) {
  const [l, t] = calcLayoutPos(base.info, opts.row, opts.col)
  // const realPos = base.appendOffsetPos(layoutPos)
  
  return chrome.windows.update(opts.windowId, {
    focused: opts.focused,
    left: base.toRealLeft(l),
    top: base.toRealTop(t),
  })
}

export async function renderMatrix(
  base: Base,
  matrix: Matrix<SearchWindow>,
  presetFocused: undefined | boolean = undefined
) {
  const isWin = base.platform.os === 'win'

  const promises: Promise<chrome.windows.Window>[] = []
  for (let [row, line] of matrix.entries()) {
    for (let [col, u] of line.entries()) {
      const isLastLine = isCurrentRow(matrix, row)
      const p = renderWindow(base, {
        windowId: u.windowId,
        focused: (presetFocused === undefined) ? (isWin || isLastLine) : presetFocused,
        row,
        col
      })
      promises.push(p)
    }
  }

  return Promise.all(promises)
}

export function renderCol(
  base: Base,
  matrix: Matrix<SearchWindow>,
  selectCol: number,
  presetFocused: undefined | boolean = undefined
) {
  const isWin = base.platform.os === 'win'

  const promises: Promise<chrome.windows.Window>[] = []
  for (let [row, line] of matrix.entries()) {
    for (let [col, u] of line.entries()) {
      if (selectCol === col) {
        const isLastLine = isCurrentRow(matrix, row)
        const p = renderWindow(base, {
          windowId: u.windowId,
          focused: (presetFocused === undefined) ? (isWin || isLastLine) : presetFocused,
          row,
          col
        })
        promises.push(p)
      }
    }
  }

  return Promise.all(promises)
}

type RenderInfo = {
  windowId: number
  left?: number
  top?: number
  width?: number
  height?: number
  focused?: boolean
}
type RenderSeries = Array<RenderInfo>
async function render(rs: RenderSeries) {
  // rs.map()
}
