import cfg from '../../config'
import { load as loadEnvironment, Environment } from '../../environment'
import { load as loadOptions, Options } from '../../options'
import { getCurrentDisplayLimit, Limit } from './limit'
import { autoAdjustHeight, autoAdjustWidth } from './auto-adjust'
import { initSearchMatrix, SearchMatrix } from './search-matrix'
import { ToRealPos } from './pos'

const getPlatformInfo = () => (new Promise<chrome.runtime.PlatformInfo>(
  res => chrome.runtime.getPlatformInfo(res)
))

function basePos(...args: Parameters<typeof ToRealPos>) {
  const [ toRealLeft, toRealTop ] = ToRealPos(...args)
  return { toRealLeft, toRealTop }
}

type BaseInfo = {
  window_height: number
  window_width: number
  gap_horizontal: number
  titlebar_height: number
}
export type Base = {
  limit: Limit,
  platform: chrome.runtime.PlatformInfo,
  info: BaseInfo,
  options: Options,
  search_matrix: SearchMatrix
  total_height: number
} & ReturnType<typeof basePos>

async function initBase(
  environment: Environment,
  options: Options,
): Promise<Base> {
  const [limit, platform] = await Promise.all([
    getCurrentDisplayLimit(),
    getPlatformInfo()
  ])

  const gap_horizontal = cfg.SEARCH_WINDOW_GAP_HORIZONTAL

  const {
    max_window_per_line, total_width, window_width
  } = autoAdjustWidth(gap_horizontal, limit.width)

  const [
    total_row,
    search_matrix
  ] = initSearchMatrix(max_window_per_line, options.site_matrix)

  const { window_height, total_height } = autoAdjustHeight(
    total_row,
    environment.titlebar_height,
    limit.height
  )

  return Object.freeze({
    limit,
    platform,
    options,
    search_matrix,
    total_height,

    info: {
      window_height,
      window_width,
      gap_horizontal,
      titlebar_height: environment.titlebar_height,
    },

    ...basePos(limit, total_width, total_height)
  })
}

export async function createBase() {
  const [environment, options] = await Promise.all([
    loadEnvironment(),
    loadOptions()
  ])

  return initBase(environment, options)
}
