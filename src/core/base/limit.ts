export type Limit = Unpromise<ReturnType<typeof getCurrentDisplayLimit>>
export async function getCurrentDisplayLimit() {
  const displayInfoList = await chrome.system.display.getInfo()
  const displayInfo = displayInfoList[0]

  const {
    left: minX,
    top: minY,
    width,
    height
  } = displayInfo.workArea

  return Object.freeze({
    minX,
    minY,
    maxX: minX + width,
    maxY: minY + height,
    width,
    height,
  })
}
