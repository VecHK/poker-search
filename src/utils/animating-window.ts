import BezierEasing from 'bezier-easing'

export type WindowPos = {
  width?: number
  height?: number
  left?: number
  right?: number
}
function calc(
  ease: BezierEasing.EasingFunction,
  startTime: number,
  nowTiming: number,
  totalTiming: number,
  from: number,
  to: number,
): number {
  const juli = Math.abs(from - to)
  const currentTiming = nowTiming - startTime
  const j = juli * ease(currentTiming ? currentTiming / totalTiming : 0)
  // console.log(j)
  if (to > from) {
    return Math.floor(from + j)
  } else {
    return Math.floor(from - j)
  }
}

export default async function animatingWindow<WP extends WindowPos>(
  winId: number,
  totalTiming: number,
  from: WP,
  to: WP
) {
  const ease = BezierEasing(.42, 0, .58, 1)

  const startTime = Date.now()

  for (; (Date.now() - startTime) < totalTiming ;) {
    let newO: WindowPos = {}

    let k: keyof typeof from
    for (k in from) {
      const fromVal = from[k]
      const toVal = to[k]
      if (typeof fromVal === 'number' && typeof toVal === 'number') {
        const len = calc(
          ease,
          startTime,
          Date.now(),
          totalTiming,
          fromVal,
          toVal
        )
        newO = { ...newO, [k]: len }
      }
    }

    await chrome.windows.update(winId, newO)
  }

  await chrome.windows.update(winId, to)
}
