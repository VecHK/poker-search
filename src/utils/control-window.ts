import { partial } from 'ramda'
import { Limit } from './base/limit'
import cfg from '../config'
import { calcBaseY } from './base/pos'

export const calcControlWindowPos = partial((
  control_window_height: number,
  control_window_width: number,
  total_height: number,
  limit: Limit,
) => {
  const base_y = calcBaseY(total_height, limit.height)

  const top = total_height - control_window_height + base_y + limit.minY
  const left = ((limit.width - control_window_width) / 2) + limit.minX
  return [ top, left ] as const
}, [cfg.CONTROL_WINDOW_HEIGHT, cfg.CONTROL_WINDOW_WIDTH])
