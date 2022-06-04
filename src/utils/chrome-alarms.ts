import { createMemo, Lock } from 'vait'
import generateId from './generate-id'

export function alarmTimeout(timing: number) {
  const [lock, pass] = Lock()
  alarmSetTimeout(timing, pass)
  return lock
}

// 若程序处于背景的话，setTimeout 将会变慢许多
// 所以需要使用到 chrome.alarms ref: #105
export function alarmSetTimeout(timing: number, callback: () => void) {
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

export function alarmTask(
  timing: number,
  firstTask: () => void
) {
  const [getTask, instead] = createMemo(firstTask)
  const discard = alarmSetTimeout(timing, () => {
    getTask()()
  })

  return [instead, discard] as const
}
