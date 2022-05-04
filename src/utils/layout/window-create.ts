import { SearchWindowMatrix, SearchWindowRow } from './window'
import { Base } from '../base'
import { SearchMatrix } from '../base/search-matrix'
import { calcPos } from '../pos'

type PlainUnit = null
type Unit = PlainUnit | {
  url: string
  getWindowId: () => number
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
    if (newWindow.top === undefined) {
      throw Error('newWindow.top is undefined')
    } else if (newWindow.left === undefined) {
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

export async function constructSearchWindows(
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
