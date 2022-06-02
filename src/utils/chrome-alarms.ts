import { Lock } from 'vait'
import generateId from './generate-id'

export function alarmTimeout(timing: number) {
  const [lock, pass] = Lock()
  alarmSetTimeout(timing, pass)
  return lock
}

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
