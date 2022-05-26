import { SearchWindowMatrix, SearchWindowRow } from './window'
import { Base } from '../base'
import { SearchMatrix } from '../base/search-matrix'
import { calcRealPos } from './pos'
import { isCurrentRow } from './matrix'
import { renderMatrix } from './render'
import { Signal } from './signal'
import { Lock } from 'vait'

type PlainUnit = null
type Unit = PlainUnit | {
  url: string
  getWindowId: () => number
}

function CreateWindow(url: string, CreateData: chrome.windows.CreateData) {
  let windowId: number
  const newUnit: Unit = {
    url,
    getWindowId: () => windowId
  }

  const createP = chrome.windows.create({
    ...CreateData,
    url,
  }).then(newWindow => {
    if (newWindow.id === undefined) {
      throw Error('newWindow.id is undefined')
    } else {
      windowId = newWindow.id
      return newWindow
    }
  })

  return [newUnit, createP] as const
}

// export async function constructSearchWindows(
//   base: Base,
//   search_matrix: SearchMatrix,
//   keyword: string,
//   canContinue: () => boolean,
//   stop: () => void
// ) {
//   const ids: number[] = []
//   const newMatrix: SearchWindowMatrix = []

//   search_matrix = [...search_matrix].reverse()

//   for (let [row, cols] of search_matrix.entries()) {
//     const newRow: SearchWindowRow = []
//     newMatrix.push(newRow)
//     for (let [col, getSearchURL] of cols.entries()) {

//       const url = getSearchURL(keyword)

//       const [left, top] = calcRealPos(base, row, col)

//       if (canContinue()) {
//         const [win, p] = CreateWindow(url, {
//           type: 'popup',
//           width: base.info.window_width,
//           height: base.info.window_height,
//           left,
//           top,
//         })
//         await p
//         const windowId = win.getWindowId()
//         ids.push(windowId)
//         newRow.push({
//           state: 'NORMAL',
//           windowId
//         })
//         const h = (closedWindowId: number) => {
//           if (windowId === closedWindowId) {
//             chrome.windows.onRemoved.removeListener(h)
//             stop()
//           }
//         }
//         chrome.windows.onRemoved.addListener(h)
//       } else {
//         // cancel
//         throw Object.assign(Error('Cancel'), { ids, cancel: true })
//       }
//     }
//   }

//   return newMatrix
// }

type CreateData = {
  url: string
  window_data: chrome.windows.CreateData
}

export async function constructSearchWindowsFast(
  base: Base,
  search_matrix: SearchMatrix,
  keyword: string,
  creating_signal: Signal<void>,
  stop_creating_signal: Signal<void>,
): Promise<SearchWindowMatrix> {
  search_matrix = [...search_matrix].reverse()

  const create_matrix: CreateData[][] = []

  for (let [row, cols] of search_matrix.entries()) {
    const create_row: CreateData[] = []
    create_matrix.push(create_row)

    for (let [col, getSearchURL] of cols.entries()) {
      const url = getSearchURL(keyword)

      const [left, top] = calcRealPos(base, row, col)

      if (isCurrentRow(search_matrix, row)) {
        create_row.push({
          url,
          window_data: {
            type: 'popup',
            focused: true,
            width: base.info.window_width,
            height: base.info.window_height,
            left,
            top,
          }
        })
      } else {
        create_row.push({
          url,
          window_data: {
            type: 'popup',
            focused: false,
            width: base.info.window_width,
            height: base.info.titlebar_height,
            left,
            top,
          }
        })
      }
    }
  }

  let __is_creating_close__ = false
  const handler_list: ((closedWindowId: number) => void)[] = []
  const ids: number[] = []
  let new_matrix: SearchWindowMatrix = []

  const stopCreatingHandler = () => {
    stop_creating_signal.unReceive(stopCreatingHandler)
    __is_creating_close__ = true
    ids.forEach(id => {
      chrome.windows.remove(id)
    })
  }
  stop_creating_signal.receive(stopCreatingHandler)

  for (const [row, create_row] of [...create_matrix].reverse().entries()) {
    const new_row: SearchWindowRow = []
    new_matrix.push(new_row)

    if (row === 1) {
      await timeout(1000)
    } else {
      await timeout(100)
    }

    for (const create of create_row) {
      if (__is_creating_close__) {
        creating_signal.trigger()
        const [wait_eternal] = Lock()
        await wait_eternal
      } else {
        const [win, p] = CreateWindow(create.url, {
          ...create.window_data
        })
  
        await p
        const windowId = win.getWindowId()
        ids.push(windowId)
        new_row.push({
          state: 'NORMAL',
          windowId,
        })

        const h = (closedWindowId: number) => {
          if (windowId === closedWindowId) {
            console.log('creating close')
            chrome.windows.onRemoved.removeListener(h)
            __is_creating_close__ = true
          }
        }
        handler_list.push(h)
        chrome.windows.onRemoved.addListener(h)
      }
    }
  }

  stop_creating_signal.unReceive(stopCreatingHandler)
  handler_list.forEach((fn) => {
    chrome.windows.onRemoved.removeListener(fn)
  })

  new_matrix = [...new_matrix].reverse()

  await renderMatrix(base, new_matrix, true, false)

  return new_matrix
}

const timeout = (ms: number) => new Promise(res => setTimeout(res, ms))
