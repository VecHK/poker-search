import { curry } from 'ramda'
import cfg from '../../config'
import { load as loadEnvironment } from '../../environment'
import { load as loadOptions, Options } from '../../options'
import { calcWindowsTotalHeight, calcWindowsTotalWidth } from './../pos'
import { getCurrentDisplayLimit, Limit } from './limit'
import { createSearchMatrix } from './search-matrix'

const getPlatformInfo = () => (new Promise<chrome.runtime.PlatformInfo>(
  res => chrome.runtime.getPlatformInfo(res)
))

// 计算横向最大能容纳的窗口数
type totalWidth = number
type count = number
function calcMaxColumns(
  maxWidth: number, windowWidth: number, gapHorizontal: number
) {
  function c(multi: number): Readonly<[count, totalWidth]> {
    const totalWidth = calcWindowsTotalWidth(multi + 1, windowWidth, gapHorizontal)
    if (totalWidth > maxWidth) {
      return [multi, calcWindowsTotalWidth(multi, windowWidth, gapHorizontal)]
    } else {
      return c(multi + 1)
    }
  } 

  return c(1)
}

const dimAdd = curry((offset: number, dimension: number) => {
  return Math.round(offset + dimension)
})
const CreateToRealPos = (
  limit: Limit,
  totalWidth: number,
  totalHeight: number
) => {
  const baseX = (limit.width - totalWidth) / 2
  const baseY = calcBaseY(totalHeight, limit.height)

  const offsetX = baseX + limit.minX
  const offsetY = baseY + limit.minY

  const toRealLeft = dimAdd(offsetX)
  const toRealTop = dimAdd(offsetY)

  return [toRealLeft, toRealTop] as const
}

function basePos(...args: Parameters<typeof CreateToRealPos>) {
  const [toRealLeft, toRealTop] = CreateToRealPos(...args)
  return { toRealLeft, toRealTop }
}

function calcTotalHeight(rowCount: number, o: RequireInfo) {
  const totalWindowsHeight = calcWindowsTotalHeight(
    rowCount, o.windowHeight, o.titleBarHeight
  )
  const totalHeight = (
    totalWindowsHeight + o.gapHorizontal + cfg.CONTROL_WINDOW_HEIGHT
  )
  return totalHeight
}

function calcBaseY(
  totalHeight: number,
  limitHeight: number
) {
  const baseY = Math.round((limitHeight - totalHeight) / 2)
  return baseY
}

function baseControl(limit: Limit, totalHeight: number) {
  return {
    calcControlWindowPos() {
      const baseY = calcBaseY(totalHeight, limit.height)

      const top = totalHeight - cfg.CONTROL_WINDOW_HEIGHT + baseY + limit.minY
      const left = ((limit.width - cfg.CONTROL_WINDOW_WIDTH) / 2) + limit.minX
      return [Math.round(top), Math.round(left)] as const
    }
  }
}

export type RequireInfo = {
  windowHeight: number
  windowWidth: number
  gapHorizontal: number
  titleBarHeight: number
  options: Options
}

export type Base = Unpromise<ReturnType<typeof initBase>>
export async function initBase(info: RequireInfo) {
  const [limit, platform] = await Promise.all([
    getCurrentDisplayLimit(),
    getPlatformInfo()
  ])

  const [max_window_per_line, totalWidth] = calcMaxColumns(
    limit.width, info.windowWidth, info.gapHorizontal
  )

  const search_matrix = createSearchMatrix(
    cfg.PLAIN_WINDOW_URL_PATTERN,
    max_window_per_line,
    info.options.site_matrix,
  )
  const search_count = search_matrix.flat().length
  const total_row = Math.ceil(search_count / max_window_per_line)

  const matrix_height = calcTotalHeight(total_row, info)

  return Object.freeze({
    limit,
    platform,
    info: {
      windowHeight: info.windowHeight,
      windowWidth: info.windowWidth,
      gapHorizontal: info.gapHorizontal,
      titleBarHeight: info.titleBarHeight,
    },
    options: info.options,
    max_window_per_line,
    search_matrix,

    ...basePos(limit, totalWidth, matrix_height),
    ...baseControl(limit, matrix_height),
  })
}

export async function createBase() {
  const [environment, options] = await Promise.all([
    loadEnvironment(),
    loadOptions()
  ])

  return initBase({
    windowWidth: cfg.SEARCH_WINDOW_WIDTH,
    windowHeight: cfg.SEARCH_WINDOW_HEIGHT,
    gapHorizontal: cfg.SEARCH_WINDOW_GAP_HORIZONTAL,
    titleBarHeight: environment.titleBarHeight,
    options,
  })
}
