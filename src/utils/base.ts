import cfg from "../config"
import { SearchPatternList } from "./search"

export const calcTotalWidth = (multi: number, width: number, gap: number) => {
  if (multi === 1) {
    return width * multi
  } else {
    return (width * multi) + (gap * (multi - 1))
  }
}
export const calcTotalHeight = (multi: number, windowHeight: number, titleBarHeight: number) => {
  if (multi === 1) {
    return windowHeight
  } else {
    return (multi * titleBarHeight) + (windowHeight - titleBarHeight)
  }
}

const getPlatformInfo = () => (new Promise<chrome.runtime.PlatformInfo>(
  res => chrome.runtime.getPlatformInfo(res)
))

async function getCurrentDisplayLimit() {
  const displayInfoListP = chrome.system.display.getInfo()
  const platformP = getPlatformInfo()

  const displayInfoList = await displayInfoListP
  const platform = await platformP

  const displayInfo = displayInfoList[0]

  const {
    left: minX,
    top: minY,
    width,
    height
  } = displayInfo.workArea

  return Object.freeze({
    platform,
    minX,
    minY,
    maxX: minX + width,
    maxY: minY + height,
    width,
    height,
  })
}

// 计算横向最大能容纳的窗口数
function calcMaxColumns(
  maxWidth: number, windowWidth: number, gapHorizontal: number
) {
  type totalWidth = number
  type count = number
  function c(multi: number): [count, totalWidth] {
    const totalWidth = calcTotalWidth(multi, windowWidth, gapHorizontal)
    if (totalWidth > maxWidth) {
      return [multi - 1, calcTotalWidth(multi - 1, windowWidth, gapHorizontal)]
    } else {
      return c(multi + 1)
    }
  }

  return c(1)
}

export type Unpromise<T extends Promise<any>> = T extends Promise<infer U> ? U : never;
export type Base = Unpromise<ReturnType<typeof initBase>>
export async function initBase(info: {
  windowHeight: number
  windowWidth: number
  gapHorizontal: number
  titleBarHeight: number
  searchPatternList: SearchPatternList
}) {
  const limit = await getCurrentDisplayLimit()

  const [max_window_per_line, totalWidth] = calcMaxColumns(
    limit.width, info.windowWidth, info.gapHorizontal
  )

  const startX = Math.round((limit.width - totalWidth) / 2)

  function getTotalHeight(rowCount: number) {
    const totalWindowsHeight = calcTotalHeight(
      rowCount, info.windowHeight, info.titleBarHeight
    )
    const totalHeight = (
      totalWindowsHeight + info.gapHorizontal + cfg.CONTROL_WINDOW_HEIGHT
    )
    return totalHeight
  }

  function getStartY(rowCount: number) {
    const totalHeight = getTotalHeight(rowCount)
    const startY = Math.round((limit.height - totalHeight) / 2)
    return startY
  }

  const total_line = Math.ceil(info.searchPatternList.length / max_window_per_line)

  return Object.freeze({
    ...limit,
    info,
    startX,
    max_window_per_line,
    total_line,
    getTotalHeight,
    getStartY,
    searchPatternList: info.searchPatternList,
    getControlWindowPos(rowCount: number) {
      const totalHeight = getTotalHeight(rowCount)

      const top = totalHeight - cfg.CONTROL_WINDOW_HEIGHT + getStartY(5) + limit.minY
      const left = ((limit.width - cfg.CONTROL_WINDOW_WIDTH) / 2) + limit.minX
      return [top, left]
    }
  })
}
