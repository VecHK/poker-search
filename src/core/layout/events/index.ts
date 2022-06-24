import { compose, equals, not } from 'ramda'
import { Atomic, Memo, Signal } from 'vait'
import cfg from '../../../config'
import { getWindowId, WindowID } from './../window'
import { AlarmSetTimeout, AlarmTask } from '../../../utils/chrome-alarms'
import { ChromeEvent } from '../../../utils/chrome-event'

import { InitRefocusEvent, InitRefocusLayout } from './refocus'
import InitMinimizedDetecting from './minimized-detecting'
import { Limit } from '../../base/limit'

type Route = 'REMOVED' | 'MAXIMIZED' | 'FOCUS' | 'MINIMIZED'

// 回避 Windows 的双次触发 focusChanged 事件
// refs: #101 #109 #115
function DoubleFocusProtect(
  { isLayout, isNone, signal }: {
    isLayout: (id: WindowID) => boolean,
    isNone: (id: WindowID) => boolean,
    signal: Signal<Route>
  },
  callback: (true_id: WindowID) => void
) {
  type Callback = (id: WindowID) => void

  const [getReceivedId, setReceivedId] = Memo<Array<WindowID>>([])
  const clearReceivedId = () => setReceivedId([])
  const appendReceivedId = (win_id: WindowID) => setReceivedId([...getReceivedId(), win_id])

  let alarm_task: ReturnType<typeof AlarmTask> | undefined

  function dispatch(received: Array<WindowID>, callback: Callback) {
    const [first, second] = received
    if (received.length === 1) {
      callback(first)
    } else {
      if (isLayout(first) && isNone(second)) {
        callback(first)
      }
      else if (isLayout(second) && isNone(first)) {
        callback(second)
      }
      else {
        // [ None, None ]
        console.log('[ None, None ]')
        callback(chrome.windows.WINDOW_ID_NONE)
      }
    }
  }

  return (
    function focusChangedHandler(
      untrusted_focused_window_id: WindowID,
    ) {
      if (alarm_task === undefined) {
        alarm_task = AlarmTask(
          cfg.WINDOWS_DOUBLE_FOCUS_WAITING_DURATION,
          () => {}
        )
      }

      let stop = false
      const handler = (route: Route) => {
        signal.unReceive(handler)
        if (route !== 'FOCUS') {
          stop = true
        }
      }
      if (signal.isEmpty()) {
        signal.receive(handler)
      }

      appendReceivedId(untrusted_focused_window_id)

      const [insteadTask] = alarm_task

      insteadTask(() => {
        signal.unReceive(handler)

        if (stop !== true) {
          const received = getReceivedId()

          alarm_task = undefined
          clearReceivedId()

          dispatch(received, callback)
        }
      })
    }
  )
}

/**
 * removed/focus/bounds 事件调度
 * 作为 onRemovedWindow、onSelectSearchWindow、onEnterFullscreenOrMaximized
 * 的代理。目的是让这三个更专注处理需求而不是关注事件调度
 *
 * 关于事件调用，会有这些场景（右边括号的为事件的调用顺序）：
 *   1) 失焦的情况点击标题栏 ( focus )
 *   2) 失焦的情况点击全屏/最大化 ( focus -> bounds )
 *   3) 失焦的情况按住 Command 点击全屏/最大化 ( bounds )
 *   4) 没有失去焦点的时候点击全屏/最大化 ( bounds )
 *   5) 失去焦点的时候拖拽窗口边缘进行尺寸调整 ( focus -> bounds )
 *   6) 没有失去焦点的时候拖拽窗口边缘进行尺寸调整 ( bounds )
 *   7) 失去焦点的时候点击关闭按钮 ( focus -> removed )
 *   8) 没有失去焦点的时候点击关闭按钮 ( removed )
 *   9) 失焦的情况按住 Command 点击关闭按钮 ( removed )
 *
 * 主要的麻烦点在于 2、5、7，他们是先执行 focus 后，才执行真正需要的事件
 * 我们需要保证调用顺序，该是选择窗口，还是最大化全屏，还是关闭，要做到
 * 这三个事件不会重复执行。
 *
 * 对于 5，可以利用 isMinimizedOrMaximized 来过滤掉
 * 2 和 7 在下边利用信号触发机制（本质上事件传递、回调函数）来解决
 * 缺点是若 bounds 事件在 cfg.SEARCH_FOCUS_INTERVAL 毫秒后未触发的话
 * 就无法成功获得预期的效果。现在的计算机响应都够快，所以这种缺点还算是
 * 能够接受的。
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

    onRefocusLayout(): Promise<void>
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
        cancelAllEvent()
        callbacks.onRefocusLayoutClose().finally(applyAllEvent)
      },
      refocus() {
        console.log('InitRefocusEvent refocus callback')
        cancelAllEvent()
        callbacks.onRefocusLayout().finally(applyAllEvent)
      }
    }
  )

  const RefocusLayout = InitRefocusLayout( compose(not, isWindowsOS) )
  const [, shouldRefocusLayout] = RefocusLayout

  const signal = Signal<Route>()

  const routeProcessing = Atomic()

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

  const focusChangedHandler = DoubleFocusProtect(
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
    console.warn('onBoundsChanged')
    const bounds_window_id = getWindowId(win)
    if (isSearchWindow(bounds_window_id)) {
      if (win.state === 'maximized') {
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
