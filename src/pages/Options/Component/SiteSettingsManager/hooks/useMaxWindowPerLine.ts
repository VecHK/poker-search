import { useContext } from 'react'
import cfg from '../../../../../config'
import { ManagerContext } from '../'
import { autoAdjustWidth } from '../../../../../core/base/auto-adjust'

export default function useMaxWindowPerLine() {
  const { limit } = useContext(ManagerContext)
  const { max_window_per_line } = autoAdjustWidth(
    cfg.SEARCH_WINDOW_GAP_HORIZONTAL,
    limit.width,
  )
  return max_window_per_line
}
