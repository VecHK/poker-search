import { ChromeEvent } from '../utils/chrome-event'

type Types =
  'FocusChanged' |
  'Refocus' |
  'RefocusLayoutClose' |
  'ChangeSearch' |
  'ChangeLaunchContextMenu'

type RuntimeMessage<T extends Types, P extends unknown> = {
  type: T,
  payload: P
}

export type Messages = {
  FocusChanged: RuntimeMessage<'FocusChanged', boolean>
  Refocus: RuntimeMessage<'Refocus', null>
  RefocusWindowClose: RuntimeMessage<'RefocusLayoutClose', null>
  ChangeSearch: RuntimeMessage<'ChangeSearch', string>
  ChangeLaunchContextMenu: RuntimeMessage<'ChangeLaunchContextMenu', boolean>
}

export function sendMessage<
  T extends keyof Messages,
>(type: T, payload: Messages[T]['payload']) {
  return chrome.runtime.sendMessage(
    chrome.runtime.id,
    { type, payload }
  )
}

export function MessageEvent<T extends keyof Messages, Msg extends  Messages[T]>(
  type: T,
  onReceiveMessage: (
    payload: Msg['payload'],
    sender: chrome.runtime.MessageSender,
    sendRes: (response?: any) => void
  ) => void
) {
  const [ applyReceive, cancelReceive ] = ChromeEvent(
    chrome.runtime.onMessage,
    (msg: Msg, sender, sendRes) => {
      if (type === msg.type) {
        console.log(`received ${msg.type} message:`, msg.payload)
        onReceiveMessage(msg.payload, sender, sendRes)
      }
    }
  )

  return [ applyReceive, cancelReceive ]
}
