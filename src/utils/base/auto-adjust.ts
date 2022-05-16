import { partial } from 'ramda'
import cfg from '../../config'
import { calcWindowsTotalHeight, calcWindowsTotalWidth } from '../pos'

// 计算横向最大能容纳的窗口数
type totalWidth = number
type count = number
function calcMaxColumns(
  limit_width: number, window_width: number, gap_horizontal: number
) {
  function c(count: number): Readonly<[count, totalWidth]> {
    const total_width = calcWindowsTotalWidth(count + 1, window_width, gap_horizontal)
    if (total_width > limit_width) {
      return [count, calcWindowsTotalWidth(count, window_width, gap_horizontal)]
    } else {
      return c(count + 1)
    }
  } 

  return c(1)
}

export function autoAdjustWidth(
  gap_horizontal: number,
  limit_width: number,
): {
  max_window_per_line: number
  total_width: number
  window_width: number
} {
  const window_width = cfg.SEARCH_WINDOW_WIDTH_NORMAL
  const [max_window_per_line, total_width] = calcMaxColumns(
    limit_width, window_width, gap_horizontal
  )

  if (max_window_per_line >= cfg.NORMAL_WINDOW_WINDOW_COUNT) {
    return { max_window_per_line, total_width, window_width }
  } else {
    const window_width = cfg.SEARCH_WINDOW_WIDTH_SMALL
    const [max_window_per_line, total_width] = calcMaxColumns(
      limit_width, window_width, gap_horizontal
    )
    return { max_window_per_line, total_width, window_width }
  }
}

const calcTotalHeight = partial(function calcTotalHeight(
  control_window_gap: number,
  control_window_height: number,
  o: {
    row: number,
    window_height: number,
    titlebar_height: number,
  }
) {
  const windows_height = calcWindowsTotalHeight(
    o.row, o.window_height, o.titlebar_height
  )

  return windows_height + control_window_gap + control_window_height
}, [cfg.SEARCH_WINDOW_GAP_HORIZONTAL, cfg.CONTROL_WINDOW_HEIGHT])

export const autoAdjustHeight = partial(function autoAdjustHeight(
  height_list: number[],
  total_row: number,
  titlebar_height: number,
  limit_height: number,
): { window_height: number; total_height: number } {
  if (height_list.length === 0) {
    throw Error('none available window height')
  } else {
    const [window_height, ...remain_height_list] = height_list

    const total_height = calcTotalHeight({
      row: total_row,
      window_height,
      titlebar_height,
    })

    if (total_height < limit_height) {
      return { window_height, total_height }
    } else {
      return autoAdjustHeight(
        remain_height_list, total_row, titlebar_height, limit_height
      )
    }
  }
}, [cfg.SEARCH_WINDOW_HEIGHT_LIST])
