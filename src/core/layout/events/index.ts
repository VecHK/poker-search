import { compose, equals, not } from 'ramda'
import { Atomic, Signal } from 'vait'
import cfg from '../../../config'
import { getWindowId, WindowID } from './../window'
import { AlarmSetTimeout } from '../../../utils/chrome-alarms'
import { ChromeEvent } from '../../../utils/chrome-event'

import { Limit } from '../../base/limit'

import DoubleFocusProtection from './double-focus-protection'
import { InitRefocusEvent, InitRefocusLayout } from './refocus'
import InitMinimizedDetecting from './minimized-detecting'

export type Route = 'REMOVED' | 'FOCUS' | 'MAXIMIZED' | 'MINIMIZED'
type CallRoute<R extends Route, P extends Record<string, unknown>> = {
  route: R,
  payload: P
}

type R =
  CallRoute<'MAXIMIZED', { id: WindowID, win: chrome.windows.Window }> |
  CallRoute<'MINIMIZED', { win_list: chrome.windows.Window[] }> |
  CallRoute<'REMOVED', { id: WindowID }> |
  CallRoute<'FOCUS', { id: WindowID }>

interface CallEvent {
  (r: R): void
}

function isMaximized(win: chrome.windows.Window) {
  return win.state === 'maximized'
}

/**
 * TrustedEvents 事件调度
 *
 * 实现这个的目的是因为：
 *   A) Windows 系统中的 Chrome，有时候会触发两次 onFocusChanged。见 #101
 *   B) Windows 系统中的 Chrome，有时候会无法触发 WINDOW_NONE 的 onFocusChanged。见 #109
 *   C) macOS 系统中的 Chrome，会无法识别 state: Minimized 的 onBoundsChanged。见 #130
 *   D) onFocusChanged 与 onBoundsChanged 存在一些冲突
 *
 * 对于 (A)，见 DoubleFocusProtection。大概是定了一个时间，然后在超时的时候查询
 * 在这个时间内收到的 window_id ，根据收到的 window_id 来判断真正的 focusChanged
 *
 * 对于 (B)，使用了唤回窗来做，见InitRefocusEvent、InitRefocusLayout。大概就是新建了
 * 一个窗口，然后点击这个窗口里的按钮后发送 REFOCUS 的消息,
 * 控制窗的 useReFocusMessage 钩子在收到这个消息的时候进行poker layout 的重新焦聚
 *
 * 对于 (C)，因为还原窗口原本是设想点击最大化按钮的，但macOS中并没有这种按钮
 * mac里只有类似的全屏按钮，可是用全屏作为还原窗口的话看起来会很奇怪，而且在系统资源紧张
 * 的时候表现效果很差。可以利用最小化来去做，可是 onBoundsChanged 似乎并不能
 * 触发最小化的事件，于是只能自己实现了，见 InitMinimizedDetecting。
 *
 * 对于 (D)，在窗口失焦的时候点击最小化、最大化、全屏，会先触发 onFocusChanged 事件后
 * 再触发 onBoundsChanged，这就需要消除掉这种冲突的情况。关于 onFocusChanged、onBoundsChanged 的
 * 事件调用，会有这些情况（右边括号的为事件的调用顺序）：
 *   1. 失焦的情况点击标题栏 ( focus )
 *   2. 失焦的情况点击全屏/最大化 ( focus -> bounds )
 *   3. 失焦的情况按住 Command 点击全屏/最大化 ( bounds )
 *   4. 没有失去焦点的时候点击全屏/最大化 ( bounds )
 *   5. 失去焦点的时候拖拽窗口边缘进行尺寸调整 ( focus -> bounds )
 *   6. 没有失去焦点的时候拖拽窗口边缘进行尺寸调整 ( bounds )
 *   7. 失去焦点的时候点击关闭按钮 ( focus -> removed )
 *   8. 没有失去焦点的时候点击关闭按钮 ( removed )
 *   9. 失焦的情况按住 Command 点击关闭按钮 ( removed )
 *
 * 主要的麻烦点在于 2、5、7，他们是先执行 focus 后，才执行真正需要的事件
 * 我们需要保证调用顺序，该是选择窗口，还是最大化全屏，还是关闭，要做到
 * 这三个事件不会重复执行。
 *
 * 对于 5，可以利用 isMaximized 来过滤掉，因为 onBoundsChanged 只需要用到最大化
 * 2 和 7 在下边利用信号触发机制（本质上事件传递、回调函数）来解决
 * 缺点是若 bounds 事件在 cfg.SEARCH_FOCUS_INTERVAL 毫秒后未触发的话
 * 就无法成功获得预期的效果。不过现在的计算机响应都够快，所以这种缺点还算是
 * 能够接受的。
 *
 * 这儿有个没有考虑的情况，那就是 InitMinimizedDetecting 没有考虑进来。
 * 不过似乎是没有冲突的。
 */
type RL = ReturnType<typeof InitRefocusLayout>
export default async function TrustedEvents({
  getRegIds,
  control_window_id,
  limit,
  platform,
  ...callbacks
}: {
  getRegIds(): WindowID[]
  control_window_id: WindowID
  limit: Limit,
  platform: chrome.runtime.PlatformInfo

  onRemovedWindow(removed_window_id: WindowID): Promise<void>
  onSelectSearchWindow(
    focused_window_id: WindowID,
    RefocusLayout: RL
  ): Promise<void>,
  onEnterMaximized(
    win: chrome.windows.Window,
    RefocusLayout: RL
    ): Promise<void>
  onEnterMinimized(
    win_list: chrome.windows.Window[],
    RefocusLayout: RL
  ): Promise<void>

  onRefocusLayoutClose(): Promise<void>
}) {
  const isNone = equals<WindowID>(chrome.windows.WINDOW_ID_NONE)
  const isControlWindow = equals(control_window_id)
  const isSearchWindow = (id: WindowID) => getRegIds().indexOf(id) !== -1

  const isWindowsOS = () => platform.os === 'win'
  const isMacOS = () => platform.os === 'mac'

  function isLayout(id: WindowID) {
    return (isControlWindow(id) || isSearchWindow(id)) && !isNone(id)
  }

  const {
    apply: applyRefocusEvent,
    cancel: cancelRefocusEvent,
    refocus_window_id,
  } = await InitRefocusEvent(
    isWindowsOS,
    limit,
    {
      close() {
        console.log('InitRefocusEvent close callback')
        callbacks.onRefocusLayoutClose()
      }
    }
  )

  const RefocusLayout = InitRefocusLayout( compose(not, isWindowsOS) )
  const [, shouldRefocusLayout] = RefocusLayout

  const signal = Signal<Route>()

  const routeProcessing = Atomic()

  const callEvent: CallEvent = ({ route, payload }) => {
    signal.trigger(route)

    console.log('callEvent', route)

    routeProcessing(async () => {
      if (route === 'MINIMIZED') {
        cancelFocusChanged()
        cancelBoundsChanged()
        cancelRemoved()
        return (
          callbacks.onEnterMinimized(payload.win_list, RefocusLayout)
            .finally(() => {
              applyFocusChanged()
              applyBoundsChanged()
              applyRemoved()
              applyMinimized()
            })
        )
      }
      else if (route === 'MAXIMIZED') {
        cancelAllEvent()
        return (
          callbacks.onEnterMaximized(payload.win, RefocusLayout)
            .finally(() => {
              applyAllEvent()
            })
        )
      }
      else if (route === 'REMOVED') {
        return (
          callbacks.onRemovedWindow(payload.id)
        )
      }
      else if (route === 'FOCUS') {
        cancelFocusChanged()
        cancelBoundsChanged()
        return (
          callbacks.onSelectSearchWindow(payload.id, RefocusLayout)
            .finally(() => {
              shouldRefocusLayout(false)
              applyFocusChanged()
              applyBoundsChanged()
            })
        )
      }
    })
  }

  const removedHandler = (removed_window_id: WindowID) => {
    console.log('onRemoved')
    if (isSearchWindow(removed_window_id)) {
      callEvent({
        route: 'REMOVED',
        payload: { id: removed_window_id }
      })
    }
  }

  const focusChangedHandler = DoubleFocusProtection(
    { isLayout, isNone, signal },
    (true_id) => {
      if (!isLayout(true_id)) {
        console.log('shouldRefocusLayout(true)')
        if (!isWindowsOS()) {
          // 因为 Windows 存在不会触发 focusChanged 事件的问题 #109
          // 需要另一套方法来处理 #115
          // 故不需要调用 shouldRefocusLayout
          shouldRefocusLayout(true)
        }
      } else {
        console.log('doubleFocusProtect callback', true_id)
        AlarmSetTimeout(
          cfg.SEARCH_FOCUS_INTERVAL - cfg.WINDOWS_DOUBLE_FOCUS_WAITING_DURATION,
          () => {
            callEvent({
              route: 'FOCUS',
              payload: { id: true_id }
            })
          }
        )
      }
    }
  )

  const boundsChangedHandler = (win: chrome.windows.Window) => {
    console.log('onBoundsChanged')
    const bounds_window_id = getWindowId(win)
    if (isSearchWindow(bounds_window_id)) {
      if (isMaximized(win)) {
        callEvent({
          route: 'MAXIMIZED',
          payload: { id: bounds_window_id, win }
        })
      }
    }
  }

  const [ applyMinimized, cancelMinimized ] = InitMinimizedDetecting(
    isMacOS,
    getRegIds,
    async (minimized_windows) => {
      console.log('cancelMinimized', minimized_windows)
      callEvent({
        route: 'MINIMIZED',
        payload: { win_list: minimized_windows }
      })
    }
  )

  const [ applyRemoved, cancelRemoved ] = ChromeEvent(chrome.windows.onRemoved, removedHandler)
  const [ applyFocusChanged, cancelFocusChanged ] = ChromeEvent(chrome.windows.onFocusChanged, focusChangedHandler)
  const [ applyBoundsChanged, cancelBoundsChanged ] = ChromeEvent(chrome.windows.onBoundsChanged, boundsChangedHandler)

  const applyAllEvent = () => {
    console.log('applyAllEvent')
    // Windows 系统需要还原窗口 #115
    applyRefocusEvent()

    applyMinimized()

    applyRemoved()
    applyFocusChanged()
    applyBoundsChanged()
  }

  const cancelAllEvent = () => {
    console.log('cancelAllEvent')

    // Windows 系统需要还原窗口 #115
    cancelRefocusEvent()

    cancelMinimized()

    cancelRemoved()
    cancelFocusChanged()
    cancelBoundsChanged()
  }

  return { applyAllEvent, cancelAllEvent, refocus_window_id } as const
}
