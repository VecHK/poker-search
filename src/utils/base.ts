export const calcTotalWidth = (multi: number, width: number, gap: number) => {
  if (multi === 1) {
    return width * multi
  } else {
    return (width * multi) + (gap * (multi - 1))
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

function calcMaxWindowPerLine(
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
  gapVertical: number
}) {
  const limit = await getCurrentDisplayLimit()

  const [max_window_per_line, totalWidth] = calcMaxWindowPerLine(
    limit.width, info.windowWidth, info.gapHorizontal
  )

  const startX = Math.round((limit.width - totalWidth) / 2)
  const startY = Math.round((limit.height - info.windowHeight) / 2)

  return Object.freeze({
    ...limit,
    startX, startY, max_window_per_line,
    info
  })
}
