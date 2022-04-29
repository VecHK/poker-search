import React from 'react'
import { render } from 'react-dom'

import Options from './Options'
import './index.css'

import { Bezier } from 'bezier-js'
import BezierEasing from 'bezier-easing'
import animatingWindow, { WindowPos } from '../../utils/animating-window'
import { constructSearchList, toSearchURL } from '../../utils/search'
import { Base } from '../../utils/base'
import { getTitleBarHeight } from '../../config'

render(
  React.createElement(Options, { title: 'Settings' }),
  window.document.querySelector('#app-container')
)

// @ts-ignore:next-line
if (module.hot) module.hot.accept()

Object.assign(window, { Bezier, BezierEasing, animatingWindow, createLayout })
export async function createLayout() {
  const platform = await getPlatformInfo()
  const isWin = platform.os === 'win'
  const titleBarHeight = await getTitleBarHeight()
  const baseTop = 300
  const baseLeft = 800
  const baesWidth = 360
  const baseHeight = 720
  const { id: chrome_id } = chrome.runtime
  const windowsList = constructSearchList('hehe', [
    { urlPattern: `https://mobile.twitter.com/search?q=[[]]&src=typeahead_click&${chrome_id}` },
    { urlPattern: `https://www.google.com/search?q=[[]]&${chrome_id}` },
    { urlPattern: `https://pache.blog/tag/[[]]?${chrome_id}` },
    { urlPattern: `https://www.vgtime.com/search/list.jhtml?${chrome_id}=2&keyword=[[]]` },
    { urlPattern: `https://www.zhihu.com/search?type=content&q=[[]]&${chrome_id}` },
  ]).map(({ keyword, urlPattern }) => toSearchURL(keyword, urlPattern))

  let ids: number[] = []
  let latestIdx = windowsList.length - 1
  for (const [idx, url] of windowsList.entries()) {
    const l = createList(isWin, windowsList.length, latestIdx, {
      left: baseLeft,
      top: baseTop,
      width: baesWidth,
      height: baseHeight,
      titleBarHeight,
    })
    const o = l[idx]
    console.log(o)

    const { id } = await chrome.windows.create({
      type: 'popup',
      url,
      ...o,
    })
    if (id === undefined) {
      throw new Error(`id === undefined`)
    }
    ids.push(id)
  }
  
  const focusHandler = async (windowId: number) => {
    const findIndex = ids.indexOf(windowId)
    if (findIndex !== -1) {
      chrome.windows.onFocusChanged.removeListener(focusHandler)

      for (let id of ids) {
        if (id !== windowId) {
          await chrome.windows.update(id, { focused: true })
        }
      }
      await chrome.windows.update(windowId, { focused: true })

      const latestList = createList(isWin, windowsList.length, latestIdx, {
        left: baseLeft,
        top: baseTop,
        width: baesWidth,
        height: baseHeight,
        titleBarHeight,
      })
      const newList = createList(isWin, windowsList.length, findIndex, {
        left: baseLeft,
        top: baseTop,
        width: baesWidth,
        height: baseHeight,
        titleBarHeight,
      })

      const promises: Array<Promise<any>> = []
      for (const [idx] of latestList.entries()) {
        if (!compareObject(latestList[idx], newList[idx])) {
          console.log(idx, latestList[idx], newList[idx])
          const p = animatingWindow(ids[idx], 1000, latestList[idx], newList[idx], true)
          promises.push(p)
        }
      }
      latestIdx = findIndex

      await Promise.all(promises)

      chrome.windows.onFocusChanged.addListener(focusHandler)
    }
  }
  chrome.windows.onRemoved.addListener(() => {
    chrome.windows.onFocusChanged.removeListener(focusHandler)
    // ids.
    ids.forEach((id) => {
      chrome.windows.remove(id)
    })
    ids = []
  })
  chrome.windows.onFocusChanged.addListener(focusHandler)
  return () => {
    chrome.windows.onFocusChanged.removeListener(focusHandler)
  }
}

const getPlatformInfo = () => (new Promise<chrome.runtime.PlatformInfo>(
  res => chrome.runtime.getPlatformInfo(res)
))
function getZeroHeight(isWin: boolean, titleBarHeight: number) {
  if (isWin) {
    return 0
  } else {
    return titleBarHeight
  }
}

function createList(isWin: boolean, row: number, currentIdx: number, b: {
  left: number
  top: number
  width: number
  height: number
  titleBarHeight: number
}): WindowPos[] {
  const l = Array.from(Array(row))
  
  let newList: WindowPos[] = []
  let currentTop = b.top
  for (const [i] of l.entries()) {
    const zeroHeight = getZeroHeight(isWin, b.titleBarHeight)
    // console.log(b.titleBarHeight)
    const height = (i === currentIdx) ? b.height : zeroHeight
    const obj = {
      width: b.width,
      left: b.left,
      height,
      top: currentTop
    }
    currentTop = currentTop + height
    newList = [...newList, obj]
    // if (id === undefined) {
    //   throw new Error(`id === undefined`)
    // }
    // ids.push(id)
  }

  return newList
}

function compareObject<T extends Record<string, unknown>>(a: T, b: T): boolean {
  let keys = Object.keys(a) as Array<keyof typeof a>
  return keys.every(k => {
    return a[k] === b[k]
  })
}
