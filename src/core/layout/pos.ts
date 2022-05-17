import { curry } from 'ramda'
import { Base } from '../base'
import { calcWindowsTotalWidth } from '../base/auto-adjust'
import { Limit } from '../base/limit'

type Pos = Readonly<[number, number]>
export function calcLayoutPos(
  info: Omit<Base['info'], 'window_height'>,
  line: number,
  index: number
): Pos {
  const total_width = calcWindowsTotalWidth(
    index + 1,
    info.window_width,
    info.gap_horizontal
  )
  const left = total_width - info.window_width
  const top = line * info.titlebar_height
  return [left, top]
}

export function calcRealPos(base: Base, line: number, index: number) {
  const [toRealLeft, toRealTop] = ToRealPos(base.limit, base.layout_width, base.layout_height)
  const [l, t] = calcLayoutPos(base.info, line, index)
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
