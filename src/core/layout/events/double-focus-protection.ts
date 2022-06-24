
import { Memo, Signal } from 'vait'
import cfg from '../../../config'
import { Route } from '.'
import { AlarmTask } from '../../../utils/chrome-alarms'
import { WindowID } from '../window'

// 回避 Windows 的双次触发 focusChanged 事件
// refs: #101 #109
export default function DoubleFocusProtection(
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
