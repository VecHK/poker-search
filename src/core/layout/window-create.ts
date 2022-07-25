import { SearchWindowMatrix, SearchWindowRow, TabID, WindowID } from './window'
import { Base } from '../base'
import { SearchMatrix, SearchOption } from '../base/search-matrix'
import { calcRealPos } from './pos'
import { isCurrentRow } from './matrix'
import { renderMatrix } from './render'
import { Signal } from 'vait'
import { removeAllFakeUARules, setFakeUA } from './fake-ua'

type PlainUnit = null
type Unit = PlainUnit | {
  url: string
  getWindowId: () => number
  getTabId: () => number
}

function OpenSearchWindow(url: string, CreateData: chrome.windows.CreateData) {
  let windowId: WindowID
  let tabId: TabID
  const newUnit: Unit = {
    url,
    getWindowId: () => windowId,
    getTabId: () => tabId
  }

  const createP = chrome.windows.create({
    ...CreateData,
    url,
  }).then(newWindow => {
    if (newWindow.tabs === undefined) {
      throw Error('newWindow.tabs is undefined')
    }
    else if (newWindow.id === undefined) {
      throw Error('newWindow.id is undefined')
    }
    else {
      windowId = newWindow.id

      const tab = newWindow.tabs[0]
      if (tab.id === undefined) {
        throw Error('tab.id is undefined')
      } else {
        tabId = tab.id
        return newWindow
      }
    }
  })

  return [newUnit, createP] as const
}

type CreateOption = {
  url: string
  search_option: SearchOption
  window_data: chrome.windows.CreateData
} | null

export async function constructSearchWindowsFast(
  base: Base,
  search_matrix: SearchMatrix,
  keyword: string,
  creating_signal: Signal<void>,
  stop_creating_signal: Signal<void>,
): Promise<SearchWindowMatrix> {
  search_matrix = [...search_matrix].reverse()

  const create_matrix: CreateOption[][] = []

  for (let [row, cols] of search_matrix.entries()) {
    const create_row: CreateOption[] = []
    create_matrix.push(create_row)

    for (let [col, search_option] of cols.entries()) {
      const { getSearchURL, is_plain } = search_option
      const url = getSearchURL(keyword)

      const [left, top] = calcRealPos(base, row, col)

      if (is_plain && (!base.preferences.fill_empty_window)) {
        create_row.push(null)
      }
      else if (isCurrentRow(search_matrix, row)) {
        create_row.push({
          url,
          search_option,
          window_data: {
            type: 'popup',
            focused: true,
            width: base.info.window_width,
            height: base.info.window_height,
            left,
            top,
          }
        })
      }
      else {
        create_row.push({
          url,
          search_option,
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
  const created_window_ids: number[] = []
  let new_matrix: SearchWindowMatrix = []

  const stopCreatingHandler = () => {
    stop_creating_signal.unReceive(stopCreatingHandler)
    __is_creating_close__ = true
    created_window_ids.forEach(id => {
      chrome.windows.remove(id)
    })
  }
  stop_creating_signal.receive(stopCreatingHandler)

  await removeAllFakeUARules()

  for (const [row, create_row] of [...create_matrix].reverse().entries()) {
    const new_row: SearchWindowRow = []
    new_matrix.push(new_row)

    for (const create_opt of create_row) {
      if (__is_creating_close__) {
        creating_signal.trigger()
        throw Object.assign(Error(), { cancel: true })
      }
      else if (create_opt === null) {
        new_row.push({
          state: 'EMPTY',
          windowId: -9,
          tabId: -9,
          is_debugger_attach: false
        })
      }
      else {
        const [win, p] = OpenSearchWindow(create_opt.url, {
          ...create_opt.window_data
        })
        await p
        const windowId = win.getWindowId()
        const tabId = win.getTabId()
        created_window_ids.push(windowId)

        await setFakeUA(tabId)

        const { search_option } = create_opt
        const is_debugger_attach = (search_option?.site_option?.access_mode === 'MOBILE-STRONG')
        new_row.push({
          state: search_option.is_plain ? 'PLAIN' : 'NORMAL',
          windowId,
          tabId,
          is_debugger_attach,
        })

        if (is_debugger_attach) {
          // apply debugg attach
          const mobileUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'

          await chrome.debugger.attach({ tabId }, '1.2')
          await Promise.all([
            chrome.debugger.sendCommand({ tabId }, 'Emulation.setUserAgentOverride', {
              userAgent: mobileUserAgent
            }),
            chrome.debugger.sendCommand({ tabId }, 'Emulation.setDeviceMetricsOverride',{
              mobile: true,
              deviceScaleFactor: 0,
              width: create_opt.window_data.width,
              height: create_opt.window_data.height,
            })
          ])
        }

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

    if (row === 0) {
      await timeout(1000)
    } else {
      await timeout(100)
    }
  }

  new_matrix = [...new_matrix].reverse()

  const waitting_render = renderMatrix(base, new_matrix, true, false)
  await waitting_render

  // 要在 renderMatrix 之后才取消 stop_creating_signal 的监听
  stop_creating_signal.unReceive(stopCreatingHandler)
  handler_list.forEach((fn) => {
    chrome.windows.onRemoved.removeListener(fn)
  })

  return new_matrix
}

const timeout = (ms: number) => new Promise(res => setTimeout(res, ms))
