import { Memo, Lock } from 'vait'
import generateId from './generate-id'

export function alarmTimeout(timing: number) {
  const [lock, pass] = Lock()
  AlarmSetTimeout(timing, pass)
  return lock
}

// 若程序处于背景的话，setTimeout 将会变慢许多
// 所以需要使用到 chrome.alarms ref: #105
export function AlarmSetTimeout(timing: number, callback: () => void) {
  const name = generateId()
  const handler = (alarm: chrome.alarms.Alarm) => {
    if (name === alarm.name) {
      chrome.alarms.onAlarm.removeListener(handler)
      callback()
    }
  }
  chrome.alarms.onAlarm.addListener(handler)
  chrome.alarms.create(name, {
    when: Date.now() + timing
  })
  return function clearTimeout() {
    return chrome.alarms.clear(name)
  }
}

export function AlarmTask(
  timing: number,
  firstTask: () => void
) {
  const [getTask, instead] = Memo(firstTask)
  const discard = AlarmSetTimeout(timing, () => {
    getTask()()
  })

  return [instead, discard] as const
}
