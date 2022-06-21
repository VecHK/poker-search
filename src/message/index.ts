import { WindowID } from '../core/layout/window'
import { ChromeEvent } from '../utils/chrome-event'

type Types =
  'FocusChanged' |
  'Refocus' |
  'RefocusLayoutClose' |
  'ChangeSearch' |
  'ControlWindowReady'

type RuntimeMessage<T extends Types, P extends unknown> = {
  type: T,
  payload: P
}

export type Messages = {
  FocusChanged: RuntimeMessage<'FocusChanged', boolean>
  Refocus: RuntimeMessage<'Refocus', null>
  RefocusWindowClose: RuntimeMessage<'RefocusLayoutClose', null>
  ChangeSearch: RuntimeMessage<'ChangeSearch', string>
  ControlWindowReady: RuntimeMessage<'ControlWindowReady', WindowID>
}

export function sendMessage<
  T extends keyof Messages,
>(type: T, payload: Messages[T]['payload']) {
  return chrome.runtime.sendMessage(
    chrome.runtime.id,
    { type, payload }
  )
}

export function MessageEvent<T extends keyof Messages>(
  type: T,
  onReceiveMessage: (
    msg: Messages[T],
    sender: chrome.runtime.MessageSender,
    sendRes: (response?: any) => void
  ) => void
) {
  const [ applyReceive, cancelReceive ] = ChromeEvent(
    chrome.runtime.onMessage,
    (msg, sender, sendRes) => {
      console.log('receive message', msg)

      if (type === msg.type) {
        onReceiveMessage(msg, sender, sendRes)
      }
    }
  )

  return [ applyReceive, cancelReceive ]
}
