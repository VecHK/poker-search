import { Base } from "./base"

export const calcWindowsTotalWidth = (multi: number, width: number, gap: number) => {
  return (width * multi) + (gap * (multi - 1))
}
export const calcWindowsTotalHeight = (multi: number, windowHeight: number, titleBarHeight: number) => {
  if (multi === 1) {
    return windowHeight
  } else {
    return (multi * titleBarHeight) + (windowHeight - titleBarHeight)
  }
}

type Pos = Readonly<[number, number]>
export function calcPos(
  info: Omit<Base['info'], 'windowHeight'>,
  line: number,
  index: number
): Pos {
  const totalWidth = calcWindowsTotalWidth(
    index + 1,
    info.windowWidth,
    info.gapHorizontal
  )
  const left = totalWidth - info.windowWidth
  const top = line * info.titleBarHeight
  return [left, top]
}
