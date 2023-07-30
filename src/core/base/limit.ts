import cfg from '../../config'

export type Limit = Readonly<
  Record<
    'minX' | 'minY' | 'maxX' | 'maxY' | 'width' | 'height',
    number
  >
>
export async function getCurrentDisplayLimit(): Promise<Limit> {
  const displayInfo = findPrimaryDisplayInfo(
    await chrome.system.display.getInfo()
  )

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

function findPrimaryDisplayInfo(
  info_list: chrome.system.display.DisplayInfo[]
) {
  if (info_list.length === 0) {
    throw new Error('DisplayInfo 列表为空')
  } else {
    const idx = info_list.findIndex(d => d.isPrimary)
    if (idx === -1) {
      // 找不到主显时，默认返回 DisplayInfo 数组中的第一个元素作为主显示器
      return info_list[0]
    } else {
      return info_list[idx]
    }
  }
}

function debugLimit(limit: Limit): Limit {
  const newLimit = {
    ...limit,
    width: limit.width - cfg.DEBUG_DEV_TOOLS_WIDTH,
  }

  return newLimit
}
