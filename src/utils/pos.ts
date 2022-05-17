import { Base } from './base'

export const calcWindowsTotalWidth = (multi: number, width: number, gap: number) => {
  return (width * multi) + (gap * (multi - 1))
}

export const calcWindowsTotalHeight = (multi: number, window_height: number, titlebar_height: number) => {
  if (multi === 1) {
    return window_height
  } else {
    return (multi * titlebar_height) + (window_height - titlebar_height)
  }
}

type Pos = Readonly<[number, number]>
export function calcLayoutPos(
  info: Omit<Base['info'], 'window_height'>,
  line: number,
  index: number
): Pos {
  const total_width = calcWindowsTotalWidth(
    index + 1,
    info.window_width,
    info.gap_horizontal
  )
  const left = total_width - info.window_width
  const top = line * info.titlebar_height
  return [left, top]
}
