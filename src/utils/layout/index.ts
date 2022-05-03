import { Base } from '../base'
import { SearchMatrix } from '../base/search-matrix'
import { calcPos } from '../pos'
import { isCurrentRow, Unit } from './matrix'
import { renderCol } from './render'

export function timeout(timing: number) {
  return new Promise(res => setTimeout(res, timing))
}

export type SearchWindow = Readonly<{
  windowId: number
}>
export type SearchWindowRow = Array<SearchWindow>
export type SearchWindowMatrix = Array<SearchWindowRow>

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

async function constructSearchWindows(
  base: Base,
  search_matrix: SearchMatrix,
  keyword: string,
  canContinue: () => boolean,
  stop: () => void
) {
  const ids: number[] = []
  const newMatrix: SearchWindowMatrix = []

  search_matrix = [...search_matrix].reverse()

  for (let [row, cols] of search_matrix.entries()) {
    const newRow: SearchWindowRow = []
    newMatrix.push(newRow)
    for (let [col, getSearchURL] of cols.entries()) {

      const url = getSearchURL(keyword)

      const [l, t] = calcPos(base.info, row, col)

      if (canContinue()) {
        const [win, p] = createWindow(url, {
          type: 'popup',
          width: base.info.windowWidth,
          height: base.info.windowHeight,
          left: base.toRealLeft(l),
          top: base.toRealTop(t),
        })
        await p
        const windowId = win.getWindowId()
        ids.push(windowId)
        newRow.push({ windowId })
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

const pickItem = <T extends unknown>(arr: T[], idx: number) => [
  arr[idx],
  arr.slice(0, idx),
  arr.slice(idx + 1, arr.length)
] as const

export type LayoutInfo = {
  width: number
  height: number
  countPerRow: number
  searchList: Array<SearchWindow>
}

export const closeAllWindow = (ids: number[]) => {
  return ids.map(windowId => {
    return chrome.windows.remove(windowId)
  })
}

function getCol(matrix: SearchWindowMatrix, selectCol: number) {
  return matrix.map((row) => {
    return row[selectCol]
  })
}

function setCurrentRowInColumn(
  matrix: SearchWindowMatrix,
  selectRow: number,
  selectCol: number,
) {
  const col = getCol(matrix, selectCol)
  const [pick, start, end] = pickItem(col, selectRow)
  const newCol = [...start, ...end, pick]

  return matrix.map((row, line) => {
    return row.map((u, idx) => {
      if (idx === selectCol) {
        return newCol[line]
      } else {
        return u
      }
    })
  })
}

function findRowColById(
  matrix: SearchWindowMatrix,
  findId: number
): Readonly<[boolean, number, number]> {
  for (let [findRow, line] of matrix.entries()) {
    for (let [findCol, u] of line.entries()) {
      if (findId === u.windowId) {
        return [true, findRow, findCol] as const
      }
    }
  }

  return [false, -1, -1] as const
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
  const { search_matrix } = base
  let matrix = await constructSearchWindows(
    base, search_matrix, keyword, canContinue, stop
  )

  const onFocusChangedHandler = (focusedWindowId: number) => {
    if (focusedWindowId !== chrome.windows.WINDOW_ID_NONE) {
      const [find, focusLine, focusCol] = findRowColById(matrix, focusedWindowId)
      if (find && !isCurrentRow(matrix, focusLine)) {
        clearFocusChangedHandler()
        timeout(300).then(function wait() {
          const newMatrix = setCurrentRowInColumn(matrix, focusLine, focusCol)
          renderCol(base, newMatrix, focusCol, true).then(() => {
            matrix = newMatrix
            setFocusChangedHandler()
          })
        })
      }
    }
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
