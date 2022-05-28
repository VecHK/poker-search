import { createMemo, Lock, timeout } from 'vait'
import cfg from '../../config'
import { CreateChannel } from './signal'
import { getWindowId } from './window'

function InitRefocusLayout() {
  return createMemo(false)
}

/**
 * 可信任的事件处理
 * 关于事件调用，会有这些场景（右边括号的为事件的调用顺序）：
 *   1) 失焦的情况点击标题栏 ( focus )
 *   2) 失焦的情况点击全屏/最大化 先 ( focus -> bounds )
 *   3) 失焦的情况按住 Command 点击全屏/最大化 ( bounds )
 *   4) 没有失去焦点的时候点击全屏/最大化 ( bounds )
 *   5) 失去焦点的时候拖拽窗口边缘进行尺寸调整 ( focus -> bounds )
 *   6) 没有失去焦点的时候拖拽窗口边缘进行尺寸调整 ( bounds )
 *   7) 失去焦点的时候点击关闭按钮 ( focus -> removed )
 *   8) 没有失去焦点的时候点击关闭按钮 ( focus )
 */
export function trustedWindowEvents({
  getRegIds,
  control_window_id,
  ...callbacks
}: {
  getRegIds(): number[]
  control_window_id: number

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
  const isMatrixWindow = (id: number) => getRegIds().indexOf(id) !== -1
  
  const RefocusLayout = InitRefocusLayout()
  const [, shouldRefocusLayout] = RefocusLayout

  const onRemoved = (removed_window_id: number) => {
    console.log('onRemoved')
    const regIds = getRegIds()
    const is_search_window = regIds.indexOf(removed_window_id) !== -1
    if (is_search_window) {
      channel(removed_window_id).trigger('REMOVED')
      callbacks.onRemovedWindow(removed_window_id)
    }
  }

  type SignalType = 'BOUNDS' | 'REMOVED'
  const channel = CreateChannel<number, SignalType>()

  const onFocusChanged = (focused_window_id: number) => {
    console.log('onFocusChanged')
    const is_not_control_window = focused_window_id !== control_window_id
    const is_not_search_window = getRegIds().indexOf(focused_window_id) === -1
    const focused_is_not_chrome = focused_window_id === chrome.windows.WINDOW_ID_NONE

    if ((is_not_control_window && is_not_search_window) || focused_is_not_chrome) {
      shouldRefocusLayout(true)
    } else {
      const [waiting, pass] = Lock<SignalType | 'FOCUS'>()
      const detectingBoundsExist = (sig: SignalType) => {
        channel(focused_window_id).unReceive(detectingBoundsExist)
        pass(sig)
      }
      // 等待 bounds/removed 的信号，超时时间为 cfg.SEARCH_FOCUS_INTERVAL
      // 超时了，即可认为不是 情况5 ，也就确保了调用顺序
      // 至于情况7，可以判断 sig/route 是不是 REMOVED
      channel(focused_window_id).receive(detectingBoundsExist)
      timeout(cfg.SEARCH_FOCUS_INTERVAL).then(() => pass('FOCUS'))

      waiting.then(route => {
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
      })
    }
  }

  function isFullscreenOrMaximized(win: chrome.windows.Window) {
    return win.state === 'fullscreen' || win.state === 'maximized'
  }

  const onBoundsChanged = (win: chrome.windows.Window) => {
    console.log('onBoundsChanged')
    const bounds_window_id = getWindowId(win)
    if (isMatrixWindow(bounds_window_id)) {
      if (isFullscreenOrMaximized(win)) {
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
  const setBoundsChanged = () => chrome.windows.onBoundsChanged.addListener(onBoundsChanged)
  const clearFocusChanged = () => chrome.windows.onFocusChanged.removeListener(onFocusChanged)
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
