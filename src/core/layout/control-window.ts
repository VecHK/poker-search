import { Limit } from '../base/limit'
import cfg from '../../config'
import { calcBaseY } from './pos'

export const calcControlWindowPos = (
  control_window_height: number,
  total_height: number,
  limit: Limit,
) => {
  const base_y = calcBaseY(total_height, limit.height)

  const top = total_height - control_window_height + base_y + limit.minY
  const left = ((limit.width - cfg.CONTROL_WINDOW_WIDTH) / 2) + limit.minX

  return [ Math.round(top), Math.round(left) ] as const
}
