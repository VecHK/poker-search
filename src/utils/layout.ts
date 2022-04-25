import { Base, initBase } from "./base"
import { calcRealPos } from "./pos"
import { toSearchURL } from "./search"

export function timeout(timing: number) {
  return new Promise(res => setTimeout(res, timing))
}

export type Search = Readonly<{
  keyword: string
  urlPattern: string
}>

export type SearchWindow = Readonly<{
  // url: string
  // keyword: string
  windowId: number
}>

type PlainUnit = null
type PlainMatrix = Array<Array<PlainUnit>>
function createPlainMatrix(
  windowCount: number,
  maxWindowPerLine: number
) {
  const matrix: PlainMatrix = []
  const line = Math.ceil(windowCount / maxWindowPerLine)
  for (let l = 0; l < line; ++l) {
    const line: Array<PlainUnit> = []
    for (let c = 0; c < maxWindowPerLine; ++c) {
      line.push(null)
    }
    matrix.push(line)
  }
  return matrix
}

function MapMatrix<NU extends unknown, U extends unknown>(
  matrix: Array<Array<U>>,
  fn: (unit: U, line: number, index: number) => NU
): Array<Array<NU>> {
  const newMatrix = []
  for (let l = 0; l < matrix.length; ++l) {
    const line = matrix[l]
    const newLine: Array<NU> = []
    newMatrix.push(newLine)
    for (let i = 0; i < line.length; ++i) {
      const newUnit = fn(line[i], l, i)
      newLine.push(newUnit)
    }
  }
  return newMatrix
}

function createWindow(url: string, CreateData: chrome.windows.CreateData) {
  let windowId: number
  const newUnit: Unit = {
    url,
    getWindowId: () => windowId
  }

  const createP = chrome.windows.create({
    ...CreateData,
    url,
  }).then(newWindow => {
    if (newWindow.left === undefined) {
      throw new Error('newWindow.left is undefined')
    } else if (newWindow.id === undefined) {
      throw new Error('newWindow.id is undefined')
    } else {
      windowId = newWindow.id
      return newWindow
    }
  })

  return [newUnit, createP] as const
}

type Unit = PlainUnit | {
  url: string
  getWindowId: () => number
}
type Line = Array<Unit>
type Matrix = Array<Line>

function createStartMatrix(
  base: Base,
  urls: string[]
) {
  const windowCount = urls.length
  const maxWindowPerLine = base.max_window_per_line
  const plainMatrix = createPlainMatrix(
    windowCount,
    maxWindowPerLine
  )

  const urlMatrix = MapMatrix(plainMatrix, (unit, line, index) => {
    const trueIndex = (line * maxWindowPerLine) + index
    const url = urls[trueIndex]
    return url
  })

  const reverseUrlMatrix = [...urlMatrix].reverse()

  return MapMatrix(reverseUrlMatrix, (url, line, index) => {
    const [left, top] = calcRealPos(base, line, index)

    return {
      url,
      focused: line === (reverseUrlMatrix.length - 1),
      left,
      top,
    } as const
  })
}

async function constructSearchWindows(
  base: Base,
  urls: string[],
  canContinue: () => boolean,
  stop: () => void
) {
  const ids: number[] = []
  const newMatrix: Array<Array<SearchWindow>> = []

  const startMatrix = createStartMatrix(base, urls)
  for (const [lineNumber, line] of startMatrix.entries()) {
    const newLine: Array<SearchWindow> = []
    newMatrix.push(newLine)

    for (const [idx, u] of line.entries()) {
      if (canContinue()) {
        const [win, p] = createWindow(u.url, {
          type: 'popup',
          width: base.info.windowWidth,
          height: base.info.windowHeight,
          left: u.left,
          top: u.top,
        })
        await p
        const windowId = win.getWindowId()
        ids.push(windowId)
        newLine.push({ windowId })
        const h = (closedWindowId: number) => {
          if (windowId === closedWindowId) {
            chrome.windows.onRemoved.removeListener(h)
            stop()
          }
        }
        chrome.windows.onRemoved.addListener(h)
      } else {
        // cancel
        throw Object.assign(new Error('Cancel'), { ids, cancel: true })
      }
    }
  }

  return newMatrix
}

async function renderMatrix(
  base: Base,
  matrix: Array<Array<SearchWindow>>,
  // focused: boolean
) {
  const promises: Promise<chrome.windows.Window>[] = []
  for (let [lineNumber, line] of matrix.entries()) {
    for (let [idx, u] of line.entries()) {
      const isLastLine = lineNumber === (matrix.length - 1)
      const isWin = base.platform.os === 'win'
      const focused = isWin || isLastLine

      const [left, top] = calcRealPos(base, lineNumber, idx)
      const p = chrome.windows.update(u.windowId, {
        focused,
        left,
        top,
      })
      // if (base.platform.os === 'win') {
      //   await p
      // }
      promises.push(p)
    }
  }
  // const promises = MapMatrix(matrix, (u, lineNumber, idx) => {
  //   const focused = lineNumber === (matrix.length - 1)

  //   const [left, top] = calcTruePos(base, lineNumber, idx)
  //   const p = chrome.windows.update(u.windowId, {
  //     focused,
  //     left,
  //     top,
  //   })
  //   if (base.platform.os === 'win') {
  //     // await p
  //   }
  //   return p
  // }).flat()
  return Promise.all(promises)
}

const pickItem = <T extends unknown>(arr: T[], idx: number) => [
  arr[idx],
  arr.slice(0, idx),
  arr.slice(idx + 1, arr.length)
] as const

function runOnce<Args extends unknown[]>(fn: (...args: Args) => void) {
  let lock = false
  return [
    (...args: Args) => {
      if (!lock) {
        lock = true
        return fn(...args)
      }
    },
    () => lock = false
  ] as const
}

export type LayoutInfo = {
  width: number
  height: number
  countPerRow: number
  searchList: Array<Search>
}

const toIds = (matrix: Matrix) => {
  return matrix.flat()
    .map(u => u && u.getWindowId())
    .filter(id => id !== null) as number[]
}

export const closeAllWindow = (ids: number[]) => {
  return ids.map(windowId => {
    return chrome.windows.remove(windowId)
  })
}

// export type GetControl = Unpromise<ReturnType<typeof CreateLayout>>
export async function createSearch(
  canContinue: () => boolean,
  stop: () => void,
  search_list: Search[]
) {
  const windowWidth = 380
  const windowHeight = 1000
  const gapHorizontal = 30
  const gapVertical = 30
  // const Info = { windowWidth, windowHeight, gapHorizontal, gapVertical }
  const base = await initBase({ windowWidth, windowHeight, gapHorizontal, gapVertical })

  const urls = search_list.map(({ keyword, urlPattern }) => {
    return toSearchURL(keyword, urlPattern)
  })

  // let _continue = true
  // const canContinue = () => _continue
  // const stop = () => { _continue = false }
  let matrix = await constructSearchWindows(base, urls, canContinue, stop)

  const onFocusChangedHandler = (id: number) => {
    if (id === chrome.windows.WINDOW_ID_NONE) {
      // all Chrome windows have lost focus
      return
    }

    let findLine: number = -1
    let findIndex: number = -1
    MapMatrix(matrix, (u, l, i) => {
      if (id === u.windowId) {
        findLine = l
        findIndex = i
      }
    })
    if (findLine === -1) {
      return
    }

    if (findLine === matrix.length - 1) {
      // 点的就是当前这一行
      return
    }

    clearFocusChangedHandler()
    setTimeout(() => {
      const done = matrix[findLine].map(u => {
        return chrome.windows.update(u.windowId, {
          focused: true,
        })
      })
      Promise.all(done).then(async () => {
        const [pick, start, end] = pickItem(matrix, findLine)
        const newMatrix = [...start, ...end, pick]
        await renderMatrix(base, newMatrix)

        await chrome.windows.update(matrix[findLine][findIndex].windowId, {
          focused: true
        })
        matrix = newMatrix

        setFocusChangedHandler()
      })
    }, 300)
  }
  const clearFocusChangedHandler = () => chrome.windows.onFocusChanged.removeListener(onFocusChangedHandler)
  const setFocusChangedHandler = () => chrome.windows.onFocusChanged.addListener(onFocusChangedHandler)
  // setFocusChangedHandler()

  const onRemovedHandler = (windowId: number) => {
    const regIds = matrix.flat().map(u => u.windowId)
    if (regIds.indexOf(windowId) !== -1) {
      clearFocusChangedHandler()
      clearRemoveHandler()
      closeAllWindow(regIds)
    }
  }
  const clearRemoveHandler = () => chrome.windows.onRemoved.removeListener(onRemovedHandler)
  const setRemoveHandler = () => chrome.windows.onRemoved.addListener(onRemovedHandler)
  // setRemoveHandler()

  return {
    stop: () => {
      const ids = matrix.flat().map(u => u.windowId)
      clearFocusChangedHandler()
      clearRemoveHandler()
      return closeAllWindow(ids)
    },
    getMatrix: () => matrix,
    clearFocusChangedHandler,
    setFocusChangedHandler,
    clearRemoveHandler,
    setRemoveHandler,
  } as const
}
