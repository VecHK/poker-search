import { Base, calcTotalWidth } from "./base"

type Pos = Readonly<[number, number]>
export function calcPos(
  info: Omit<Base['info'], 'windowHeight'>,
  line: number,
  index: number
): Pos {
  const totalWidth = calcTotalWidth(
    index + 1,
    info.windowWidth,
    info.gapHorizontal
  )
  const left = totalWidth - info.windowWidth
  const top = line * info.titleBarHeight
  return [left, top]
}

export function calcRealPos(
  base: Base,
  line: number, // line can be 0
  index: number,
  totalLineCount: number
) {
  const [left, top] = calcPos(base.info, line, index)

  const trueLeft = left + base.startX + base.minX
  const trueTop = top + base.getStartY(totalLineCount) + base.minY

  return [trueLeft, trueTop] as const
}
