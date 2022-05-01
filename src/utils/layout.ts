import { Base } from "./base"
import { calcPos } from "./pos"
import { constructSearchList, toSearchURL } from "./search"

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
      throw Error('newWindow.left is undefined')
    } else if (newWindow.id === undefined) {
      throw Error('newWindow.id is undefined')
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
    const [l, t] = calcPos(base.info, line, index)

    return {
      url,
      focused: line === (reverseUrlMatrix.length - 1),
      left: base.toRealLeft(l),
      top: base.toRealTop(t),
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
        throw Object.assign(Error('Cancel'), { ids, cancel: true })
      }
    }
  }

  return newMatrix
}

export async function renderMatrix(
  base: Base,
  matrix: Array<Array<SearchWindow>>,
  presetFocused: undefined | boolean = undefined
) {
  const isWin = base.platform.os === 'win'

  const promises: Promise<chrome.windows.Window>[] = []
  for (let [lineNumber, line] of matrix.entries()) {
    for (let [idx, u] of line.entries()) {
      const isLastLine = lineNumber === (matrix.length - 1)
      const focused = (presetFocused === undefined) ? (isWin || isLastLine) : presetFocused

      const [l, t] = calcPos(base.info, lineNumber, idx)

      const p = chrome.windows.update(u.windowId, {
        focused,
        left: base.toRealLeft(l),
        top: base.toRealTop(t),
      })
      promises.push(p)
    }
  }

  return Promise.all(promises)
}

function renderCol(
  base: Base,
  matrix: Array<Array<SearchWindow>>,
  selectCol: number,
  presetFocused: undefined | boolean = undefined
) {
  const isWin = base.platform.os === 'win'

  const promises: Promise<chrome.windows.Window>[] = []
  for (let [lineNumber, line] of matrix.entries()) {
    for (let [idx, u] of line.entries()) {
      if (selectCol === idx) {
        const isLastLine = lineNumber === (matrix.length - 1)
        const focused = (presetFocused === undefined) ? (isWin || isLastLine) : presetFocused
  
        const [l, t] = calcPos(base.info, lineNumber, idx)
  
        const p = chrome.windows.update(u.windowId, {
          focused,
          left: base.toRealLeft(l),
          top: base.toRealTop(t),
        })
        promises.push(p)
      }
    }
  }

  return Promise.all(promises)
}

const pickItem = <T extends unknown>(arr: T[], idx: number) => [
  arr[idx],
  arr.slice(0, idx),
  arr.slice(idx + 1, arr.length)
] as const

export type LayoutInfo = {
  width: number
  height: number
  countPerRow: number
  searchList: Array<Search>
}

export const closeAllWindow = (ids: number[]) => {
  return ids.map(windowId => {
    return chrome.windows.remove(windowId)
  })
}

async function focusRow(
  base: Base,
  focusLine: number,
  focusIndex: number,
  matrix: Array<Array<SearchWindow>>
) {
  const done = matrix[focusLine].map(u => {
    return chrome.windows.update(u.windowId, {
      focused: true,
    })
  })
  await Promise.all(done)

  const [pick, start, end] = pickItem(matrix, focusLine)
  const newMatrix = [...start, ...end, pick]
  await renderMatrix(base, newMatrix)

  await chrome.windows.update(matrix[focusLine][focusIndex].windowId, {
    focused: true
  })

  return newMatrix
}

function getCol(matrix: Array<Array<SearchWindow>>, selectCol: number) {
  return matrix.map((row) => {
    return row[selectCol]
  })
}

function focusCol(
  focusLine: number,
  focusIndex: number,
  matrix: Array<Array<SearchWindow>>
) {
  const col = getCol(matrix, focusIndex)
  const [pick, start, end] = pickItem(col, focusLine)
  const newCol = [...start, ...end, pick]

  return matrix.map((row, line) => {
    return row.map((u, idx) => {
      if (idx === focusIndex) {
        return newCol[line]
      } else {
        return u
      }
    })
  })
}

export async function createSearch({
  base,
  keyword,
  canContinue,
  stop,
}: {
  base: Base
  keyword: string
  canContinue: () => boolean
  stop: () => void
}) {
  const search_list = constructSearchList(keyword, base.searchPatternList)
  const urls = search_list.map(({ keyword, urlPattern }) => {
    return toSearchURL(keyword, urlPattern)
  })

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
    } else if (findLine === matrix.length - 1) {
      // 点的就是当前这一行
      return
    }

    clearFocusChangedHandler()
    setTimeout(() => {
      const newMatrix = focusCol(findLine, findIndex, matrix)
      renderCol(base, newMatrix, findIndex, true).then(() => {
        matrix = newMatrix
        setFocusChangedHandler()
      })
    }, 300)
  }
  const clearFocusChangedHandler = () => chrome.windows.onFocusChanged.removeListener(onFocusChangedHandler)
  const setFocusChangedHandler = () => chrome.windows.onFocusChanged.addListener(onFocusChangedHandler)

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

  return {
    stop: () => {
      const ids = matrix.flat().map(u => u.windowId)
      clearFocusChangedHandler()
      clearRemoveHandler()
      return closeAllWindow(ids)
    },
    getMatrix: () => matrix,
    setMatrix: (newMatrix: Array<Array<SearchWindow>>) => {
      matrix = newMatrix
    },
    clearFocusChangedHandler,
    setFocusChangedHandler,
    clearRemoveHandler,
    setRemoveHandler,
  } as const
}
