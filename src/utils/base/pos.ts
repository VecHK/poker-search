import { curry } from 'ramda'
import { Limit } from './limit'

export const calcBaseY = (total_height: number, limit_height: number) => {
  return Math.round((limit_height - total_height) / 2)
}

const dimAdd = curry((offset: number, dimension: number) => {
  return Math.round(offset + dimension)
})

export const ToRealPos = (
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
