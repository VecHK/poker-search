import { thunkify } from 'ramda'
import { createMemo, Lock } from 'vait'
import cfg from '../../config'
import { alarmSetTimeout, alarmTimeout } from '../../utils/chrome-alarms'
import { CreateChannel } from './signal'
import { getWindowId } from './window'

type SignalType = 'BOUNDS' | 'REMOVED'

function isFullscreenOrMaximized(win: chrome.windows.Window) {
  return win.state === 'fullscreen' || win.state === 'maximized'
}

function InitRefocusLayout() {
  return createMemo(false)
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
 * 对于 5，可以利用 isFullscreenOrMaximized 来过滤掉
 * 2 和 7 在下边利用信号触发机制（本质上事件传递、回调函数）来解决
 * 缺点是若 bounds 事件在 cfg.SEARCH_FOCUS_INTERVAL 毫秒后未触发的话
 * 就无法成功获得预期的效果。现在的计算机响应都够快，所以这种缺点还算是
 * 能够接受的。
 */
export function trustedSearchWindowEvents({
  getRegIds,
  control_window_id,
  platform,
  ...callbacks
}: {
  getRegIds(): number[]
  control_window_id: number
  platform: chrome.runtime.PlatformInfo

  onRemovedWindow(removed_window_id: number): void
  onSelectSearchWindow(
    focused_window_id: number,
    RefocusLayout: ReturnType<typeof InitRefocusLayout>
  ): Promise<void>,
  onEnterFullscreenOrMaximized(
    win: chrome.windows.Window,
    RefocusLayout: ReturnType<typeof InitRefocusLayout>
  ): Promise<void>
}) {
  const isSearchWindow = (id: number) => getRegIds().indexOf(id) !== -1

  const channel = CreateChannel<number, SignalType>()

  const RefocusLayout = InitRefocusLayout()
  const [, shouldRefocusLayout] = RefocusLayout

  const onRemoved = (removed_window_id: number) => {
    console.log('onRemoved')
    if (isSearchWindow(removed_window_id)) {
      if (__ctx__ !== undefined) {
        __ctx__.setRoute('REMOVED')
      }
      channel(removed_window_id).trigger('REMOVED')
      callbacks.onRemovedWindow(removed_window_id)
    }
  }

  function focusRoute(
    focused_window_id: number,
    route: SignalType | 'FOCUS' | void
  ) {
    if (route === 'REMOVED') {
      // ignore
    } else if (route === 'BOUNDS') {
      // ignore
    } else if (route === 'FOCUS') {
      clearFocusChanged()
      clearBoundsChanged()
      return callbacks
        .onSelectSearchWindow(focused_window_id, RefocusLayout)
        .finally(() => {
          shouldRefocusLayout(false)
          setFocusChanged()
          setBoundsChanged()
        })
    }
  }

  function focusEventDispatch(focused_window_id: number) {
    const [waiting, pass] = Lock<SignalType | 'FOCUS'>()
    const detectingSignalExist = (sig: SignalType) => {
      channel(focused_window_id).unReceive(detectingSignalExist)
      pass(sig)
    }
    // 等待 bounds/removed 的信号，超时时间为 cfg.SEARCH_FOCUS_INTERVAL
    // 超时了，即可认为不是情况2、7 ，也就确保了调用顺序
    channel(focused_window_id).receive(detectingSignalExist)
    alarmTimeout(cfg.SEARCH_FOCUS_INTERVAL).then(() => pass('FOCUS'))

    waiting.then(route => {
      focusRoute(focused_window_id, route)
    })
  }

  function isNone(window_id: number): boolean {
    return window_id === chrome.windows.WINDOW_ID_NONE
  }
  function isNotLayout(window_id: number): boolean {
    const is_not_control_window = window_id !== control_window_id
    const is_not_search_window = !isSearchWindow(window_id)

    return (is_not_control_window && is_not_search_window) || isNone(window_id)
  }
  function isLayout(id: number) {
    return !isNotLayout(id)
  }

  type WindowID = number
  let __clearTimeout__: undefined | (() => Promise<unknown>)
  let __receive_history__: Array<WindowID> = []
  let __latestFn__ = (focused_window_id: number, callback: (id: number) => void) => {
    const [first, second] = __receive_history__

    if (__receive_history__.length === 1) {
      __receive_history__ = []
      callback(first)
    } else {
      __receive_history__ = []
      if (isNone(first) && isLayout(second)) {
        callback(second)
      } else if (isLayout(first) && isNone(second)) {
        callback(first)
      } else {
        // [ None, None ]
        console.warn('[ None, None ]')
        callback(chrome.windows.WINDOW_ID_NONE)
      }
    }
  }
  let __latest__: (() => void) | undefined = undefined
  function doubleFocusProtect(
    focused_window_id: number,
    callback: (id: number) => void
  ) {
    __receive_history__.push(focused_window_id)

    if (__clearTimeout__ === undefined) {
      __clearTimeout__ = alarmSetTimeout(
        cfg.WINDOWS_DOUBLE_FOCUS_WAITING_DURATION,
        () => {
          console.log('__receive_history__', __receive_history__)
          __clearTimeout__ = undefined
          __latest__ && __latest__()
        }
      )
    }

    const latest = thunkify(__latestFn__)(focused_window_id)(callback)
    __latest__ = latest
  }

  function Context() {
    const [getRoute, setRoute] = createMemo<SignalType | 'FOCUS'>('FOCUS')
    return {
      getRoute,
      setRoute,
    } as const
  }

  let __ctx__: undefined | ReturnType<typeof Context>

  const onFocusChanged = (focused_window_id: number) => {
    console.log('onFocusChanged')
    const isWindows = platform.os === 'win'
    if (isWindows) {
      if (__ctx__ === undefined) {
        __ctx__ = Context()
      }
      const life = __ctx__

      // 若程序处于背景的话，setTimeout 将会变慢许多
      // 所以需要使用到 chrome.alarms ref: #105
      doubleFocusProtect(focused_window_id, true_id => {
        if (isNotLayout(focused_window_id)) {
          console.log('shouldRefocusLayout(true)')
          shouldRefocusLayout(true)
        } else {
          const route = life.getRoute()
          console.log('true id', true_id, route)
          __ctx__ = undefined
          alarmSetTimeout(cfg.SEARCH_FOCUS_INTERVAL - cfg.WINDOWS_DOUBLE_FOCUS_WAITING_DURATION, () => {
            focusRoute(true_id, route)
          })
        }
      })
    } else {
      console.log('onFocusChanged(not windows)')
      if (isNotLayout(focused_window_id)) {
        shouldRefocusLayout(true)
      } else {
        focusEventDispatch(focused_window_id)
      }
    }
  }

  const onBoundsChanged = (win: chrome.windows.Window) => {
    console.log('onBoundsChanged')
    const bounds_window_id = getWindowId(win)
    if (isSearchWindow(bounds_window_id)) {
      if (isFullscreenOrMaximized(win)) {
        if (__ctx__ !== undefined) {
          __ctx__.setRoute('BOUNDS')
        }

        channel(bounds_window_id).trigger('BOUNDS')
        disableWindowsEvent()
        callbacks.onEnterFullscreenOrMaximized(win, RefocusLayout)
          .finally(() => {
            enableWindowsEvent()
          })
      }
    }
  }

  const setRemoved = () => chrome.windows.onRemoved.addListener(onRemoved)
  const clearRemoved = () => chrome.windows.onRemoved.removeListener(onRemoved)
  const setFocusChanged = () => chrome.windows.onFocusChanged.addListener(onFocusChanged)
  const clearFocusChanged = () => chrome.windows.onFocusChanged.removeListener(onFocusChanged)
  const setBoundsChanged = () => chrome.windows.onBoundsChanged.addListener(onBoundsChanged)
  const clearBoundsChanged = () => chrome.windows.onBoundsChanged.removeListener(onBoundsChanged)

  const enableWindowsEvent = () => {
    console.log('enableWindowsEvent')
    setRemoved()
    setFocusChanged()
    setBoundsChanged()
  }

  const disableWindowsEvent = () => {
    console.log('disableWindowsEvent')
    clearRemoved()
    clearFocusChanged()
    clearBoundsChanged()
  }

  return Object.freeze({
    enableWindowsEvent,
    disableWindowsEvent,
  })
}
