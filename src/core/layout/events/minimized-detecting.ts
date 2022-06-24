import { Memo, Signal } from 'vait'
import { AlarmTask } from '../../../utils/chrome-alarms'
import { WindowID } from '../window'

const MINIMIZED_DETECTING_INTERVAL = 1000

function doNotOperate() {}
export default function InitMinimizedDetecting(
  enableCond: () => boolean,
  getRegIds: () => WindowID[],
  callback: (w: chrome.windows.Window[]) => Promise<void>
) {
  if (enableCond()) {
    return MinimizedDetecting(getRegIds, callback)
  } else {
    return [doNotOperate, doNotOperate] as const
  }
}

class MinimizedDetectingError extends Error {}
function MinimizedDetecting(
  getRegIds: () => WindowID[],
  callback: (w: chrome.windows.Window[]) => Promise<void>
) {
  const [ isApply, setApply ] = Memo(false)
  const stop_signal = Signal<void>()

  function applyMinimized() {
    if (isApply()) {
      throw new MinimizedDetectingError('MinimizedDetecting is Applied')
    } else {
      console.log('applyMinimized')
      setApply(true)
      setTimeout()
    }
  }

  function cancelMinimized() {
    if (!isApply()) {
      console.warn(
        new MinimizedDetectingError('MinimizedDetecting is canceled')
      )
    } else {
      console.log('cancelMinimized')
      setApply(false)
      stop_signal.trigger()
    }
  }

  function setTimeout() {
    const stopHandler = () => {
      stop_signal.unReceive(stopHandler)
      discard()
    }
    stop_signal.receive(stopHandler)

    const [, discard] = AlarmTask(MINIMIZED_DETECTING_INTERVAL, async () => {
      stop_signal.unReceive(stopHandler)

      const minimized_windows = await getMinimizedSearchWindows(getRegIds)

      if (minimized_windows.length) {
        cancelMinimized()
        callback(minimized_windows)
      } else {
        setTimeout()
      }
    })
  }

  return [ applyMinimized, cancelMinimized ] as const
}

function isSearchWindow(getRegIds: () => WindowID[], id: WindowID) {
  return getRegIds().indexOf(id) !== -1
}

async function getMinimizedSearchWindows(getRegIds: () => WindowID[]) {
  const window_list = await chrome.windows.getAll({ windowTypes: ['popup'] })

  const search_windows = window_list.filter(({ id }) => {
    if (id === undefined) {
      throw Error('MinimizedDetecting Error: id is undefined')
    } else {
      return isSearchWindow(getRegIds, id)
    }
  })

  const minimized_windows = search_windows.filter(win => {
    return win.state === 'minimized'
  })

  return minimized_windows
}
