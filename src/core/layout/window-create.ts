import { SearchWindowMatrix, SearchWindowRow, TabID, WindowID } from './window'
import { Base, LayoutInfo } from '../base'
import { WindowOption, WindowOptionMatrix } from '../base/search-matrix'
import { calcRealPos } from './pos'
import { isCurrentRow } from './matrix'
import { renderMatrix } from './render'
import { Signal } from 'vait'
import { removeAllFakeUARules, setFakeUA } from '../../utils/fake-ua'
import cfg from '../../config'
import { calcWindowsTotalWidth } from '../base/auto-adjust'

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
    state: 'normal',
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

type Preparation = {
  url: string
  window_option: WindowOption
  window_data: chrome.windows.CreateData
}

export async function constructSearchWindowsFast(
  base: Base,
  layout_info: LayoutInfo,
  window_option_matrix: WindowOptionMatrix,
  keyword: string,
  creating_signal: Signal<void>,
  stop_creating_signal: Signal<void>,
): Promise<SearchWindowMatrix> {
  window_option_matrix = [...window_option_matrix].reverse()

  console.log('window_option_matrix', window_option_matrix)

  const preparation_matrix: Preparation[][] = []

  for (let [row, cols] of window_option_matrix.entries()) {
    const preparation_row: Preparation[] = []
    preparation_matrix.push(preparation_row)

    for (let [col, window_option] of cols.entries()) {
      const { composeSearchURL, type, width_size } = window_option
      const url = composeSearchURL(keyword)

      const [left, top] = calcRealPos(base.limit, layout_info, row, col, 1)

      console.log('left, top', left, top)

      if ( type === 'FILL' ) {
        preparation_row.push({
          url: '',
          window_option,
          window_data: {}
        })
      }
      else if ((type === 'PLAIN') && (!base.preferences.fill_empty_window)) {
        preparation_row.push({
          url: '',
          window_option,
          window_data: {}
        })
      }
      else if (isCurrentRow(window_option_matrix, row)) {
        // search_option.width_size
        preparation_row.push({
          url,
          window_option,
          window_data: {
            type: 'popup',
            focused: true,
            // width: layout_info.window_width
            width: calcWindowsTotalWidth(width_size, layout_info.window_width, layout_info.gap_horizontal),
            height: layout_info.window_height,
            left,
            top,
          }
        })
      }
      else {
        preparation_row.push({
          url,
          window_option,
          window_data: {
            type: 'popup',
            focused: false,
            // width: layout_info.window_width,
            width: calcWindowsTotalWidth(width_size, layout_info.window_width, layout_info.gap_horizontal),
            height: layout_info.titlebar_height,
            left,
            top,
          }
        })
      }
    }
  }

  let __suspend__ = false
  const handler_list: ((closedWindowId: number) => void)[] = []
  const created_window_ids: number[] = []
  let new_matrix: SearchWindowMatrix = []

  const stopCreatingHandler = () => {
    stop_creating_signal.unReceive(stopCreatingHandler)
    __suspend__ = true
    created_window_ids.forEach(id => {
      chrome.windows.remove(id)
    })
  }
  stop_creating_signal.receive(stopCreatingHandler)

  await removeAllFakeUARules()

  for (const [row, preparation_row] of [...preparation_matrix].reverse().entries()) {
    const new_row: SearchWindowRow = []
    new_matrix.push(new_row)

    for (const preparation of preparation_row) {
      if (__suspend__) {
        creating_signal.trigger()
        throw Object.assign(Error(), { cancel: true })
      }
      else if (
        (preparation.window_option.type === 'EMPTY') ||
        (preparation.window_option.type === 'FILL')
      ) {
        new_row.push({
          type: preparation.window_option.type,
          windowId: -9,
          tabId: -9,
          is_debugger_attach: false,
          init_height: 0,
          init_width: 0,
        })
      }
      else {
        const [win, p] = OpenSearchWindow(preparation.url, {
          ...preparation.window_data
        })
        await p
        const windowId = win.getWindowId()
        const tabId = win.getTabId()
        created_window_ids.push(windowId)

        await setFakeUA(tabId)

        const { window_option } = preparation
        const is_debugger_attach = (window_option?.site_option?.access_mode === 'MOBILE-STRONG')
        new_row.push({
          type: window_option.type,
          windowId,
          tabId,
          is_debugger_attach,
          init_width: preparation.window_data.width,
          init_height: preparation.window_data.height,
        })

        if (is_debugger_attach) {
          // apply debugg attach
          await chrome.debugger.attach({ tabId }, '1.2')
          await Promise.all([
            chrome.debugger.sendCommand({ tabId }, 'Emulation.setUserAgentOverride', {
              userAgent: cfg.MOBILE_USER_AGNET
            }),
            chrome.debugger.sendCommand({ tabId }, 'Emulation.setDeviceMetricsOverride',{
              mobile: true,
              deviceScaleFactor: 0,
              width: preparation.window_data.width,
              height: preparation.window_data.height,
            })
          ])
        }

        const h = (closedWindowId: number) => {
          if (windowId === closedWindowId) {
            console.log('creating close')
            chrome.windows.onRemoved.removeListener(h)
            __suspend__ = true
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

  const waitting_render = renderMatrix(base, layout_info, new_matrix, true, false)
  await waitting_render

  // 要在 renderMatrix 之后才取消 stop_creating_signal 的监听
  stop_creating_signal.unReceive(stopCreatingHandler)
  handler_list.forEach((fn) => {
    chrome.windows.onRemoved.removeListener(fn)
  })

  return new_matrix
}

const timeout = (ms: number) => new Promise(res => setTimeout(res, ms))
