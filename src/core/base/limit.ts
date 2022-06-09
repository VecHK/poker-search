import cfg from "../../config"

export type Limit = Readonly<
  Record<
    'minX' | 'minY' | 'maxX' | 'maxY' | 'width' | 'height',
    number
  >
>
export async function getCurrentDisplayLimit(): Promise<Limit> {
  const displayInfoList = await chrome.system.display.getInfo()
  const displayInfo = displayInfoList[0]

  const {
    left: minX,
    top: minY,
    width,
    height
  } = displayInfo.workArea

  const returnValue = Object.freeze({
    minX,
    minY,
    maxX: minX + width,
    maxY: minY + height,
    width,
    height,
  })

  if (process.env.DEBUG === 'ENABLE') {
    return debugLimit(returnValue)
  } else {
    return returnValue
  }
}

function debugLimit(limit: Limit): Limit {
  const newLimit = {
    ...limit,
    width: limit.width - cfg.DEBUG_DEV_TOOLS_WIDTH,
  }

  return newLimit
}
