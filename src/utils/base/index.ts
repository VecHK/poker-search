import cfg from '../../config'
import { calcWindowsTotalHeight, calcWindowsTotalWidth } from './../pos'
import { getSearchPatternList, SearchPatternList } from './../search'
import { getCurrentDisplayLimit, Limit } from './limit'
import { processTitleBarHeight } from './titlebar'

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

const dimAdd = (offset: number, dimension: number) => Math.round(offset + dimension)
const Create_toRealPos = (
  limit: Limit,
  totalWidth: number,
  totalHeight: number
) => {
  const baseX = (limit.width - totalWidth) / 2
  const baseY = calcBaseY(totalHeight, limit.height)

  const offsetX = baseX + limit.minX
  const offsetY = baseY + limit.minY

  const toRealLeft = dimAdd.bind(null, offsetX)
  const toRealTop = dimAdd.bind(null, offsetY)

  return [toRealLeft, toRealTop] as const
}

function basePos(...args: Parameters<typeof Create_toRealPos>) {
  const [toRealLeft, toRealTop] = Create_toRealPos(...args)
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
      return [top, left] as const
    }
  }
}

export type RequireInfo = {
  windowHeight: number
  windowWidth: number
  gapHorizontal: number
  titleBarHeight: number
  searchPatternList: SearchPatternList
}

export type Base = Unpromise<ReturnType<typeof initBase>>
export async function initBase(info: RequireInfo) {
  const limit = await getCurrentDisplayLimit()
  const platform = await getPlatformInfo()

  const [max_window_per_line, totalWidth] = calcMaxColumns(
    limit.width, info.windowWidth, info.gapHorizontal
  )

  const total_line = Math.ceil(info.searchPatternList.length / max_window_per_line)

  const totalHeight = calcTotalHeight(total_line, info)

  return Object.freeze({
    limit,
    platform,
    info,
    max_window_per_line,
    total_line,
    searchPatternList: info.searchPatternList,

    ...basePos(limit, totalWidth, totalHeight),
    ...baseControl(limit, totalHeight),
  })
}

export async function createBase(detectTitleBar: boolean) {
  const titleBarHeight = await processTitleBarHeight(detectTitleBar)
  return initBase({
    windowWidth: cfg.SEARCH_WINDOW_WIDTH,
    windowHeight: cfg.SEARCH_WINDOW_HEIGHT,
    gapHorizontal: await cfg.SEARCH_WINDOW_GAP_HORIZONTAL,
    titleBarHeight,
    searchPatternList: getSearchPatternList()
  })
}
