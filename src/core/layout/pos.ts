import { curry } from 'ramda'
import { LayoutInfo } from '../base'
import { calcWindowsTotalWidth } from '../base/auto-adjust'
import { Limit } from '../base/limit'

function calcWindowLeft(
  previous_width_size_map: number[],
  gap_horizontal: number,
  window_width: number
) {
  const gap_total = previous_width_size_map.reduce((v, width_size) => {
    return v + (width_size * gap_horizontal)
  }, 0)
  return gap_total + (
    previous_width_size_map
      .map(ws => ws * window_width)
      .reduce((v, a) => v + a, 0)
  )
}

type Pos = Readonly<[number, number]>
type WindowInfo = {
  width_size: number
  window_width: number
  gap_horizontal: number
  titlebar_height: number
}
function calcWindowPos(
  info: WindowInfo,
  line: number,
  index: number,
): Pos {
  const total_width = calcWindowsTotalWidth(
    index + 1,
    info.window_width,
    info.gap_horizontal
  )
  const left = total_width - calcWindowsTotalWidth(
    info.width_size,
    info.window_width,
    info.gap_horizontal
  )
  const top = line * info.titlebar_height
  return [left, top]
}

export function calcRealPos(
  limit: Limit,
  info: LayoutInfo,
  line: number,
  index: number,
  width_size: number
) {
  const [toRealLeft, toRealTop] = ToRealPos(
    limit,
    info.total_width,
    info.total_height,
  )
  const [l, t] = calcWindowPos({
    width_size,
    window_width: info.window_width,
    gap_horizontal: info.gap_horizontal,
    titlebar_height: info.titlebar_height
  }, line, index)
  return [toRealLeft(l), toRealTop(t)] as const
}

export const calcBaseY = (total_height: number, limit_height: number) => {
  return Math.round((limit_height - total_height) / 2)
}

const dimAdd = curry((offset: number, dimension: number) => {
  return Math.round(offset + dimension)
})

const ToRealPos = (
  limit: Limit,
  layout_width: number,
  layout_height: number,
) => {
  const base_x = (limit.width - layout_width) / 2
  const base_y = calcBaseY(layout_height, limit.height)

  const offset_x = base_x + limit.minX
  const offset_y = base_y + limit.minY

  const toRealLeft = dimAdd(offset_x)
  const toRealTop = dimAdd(offset_y)

  return [ toRealLeft, toRealTop ] as const
}
