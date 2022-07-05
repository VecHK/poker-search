import cfg from '../config'
import { autoAdjustWidth } from '../core/base/auto-adjust'
import { Limit } from '../core/base/limit'

export default function useMaxWindowPerLine(limit?: Limit) {
  if (limit === undefined) {
    return 0
  } else {
    const { max_window_per_line } = autoAdjustWidth(
      cfg.SEARCH_WINDOW_GAP_HORIZONTAL,
      limit.width,
    )
    return max_window_per_line
  }
}
