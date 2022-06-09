import { ChromeEvent } from '../utils/chrome-event'

type RuntimeMessage<T extends string, P extends unknown> = {
  type: T,
  payload: P
}

export type FocusChanged = RuntimeMessage<'focus-changed', boolean>

type Messages =
FocusChanged

export function sendMessage<
  M extends Messages
>(msg: M) {
  return chrome.runtime.sendMessage(
    chrome.runtime.id,
    msg
  )
}

export function MessageEvent<M extends Messages>(
  onReceiveMessage: (
    msg: M,
    sender: chrome.runtime.MessageSender,
    sendRes: (response?: any) => void
  ) => void
) {
  const [ applyReceive, cancelReceive ] = ChromeEvent(
    chrome.runtime.onMessage,
    (msg, sender, sendRes) => {
      if (onReceiveMessage !== undefined) {
        onReceiveMessage(msg, sender, sendRes)
      }
    }
  )

  return [ applyReceive, cancelReceive ]
}
