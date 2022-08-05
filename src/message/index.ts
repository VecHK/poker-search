import { ChromeEvent } from '../utils/chrome-event'

type Types =
  'FocusControl' |
  'ChangeSearch' |
  'ChangeLaunchContextMenu' |
  'TryPoker'

type RuntimeMessage<T extends Types, P extends unknown> = {
  type: T,
  payload: P
}

export type Messages = {
  FocusControl: RuntimeMessage<'FocusControl', null>
  ChangeSearch: RuntimeMessage<'ChangeSearch', string>
  ChangeLaunchContextMenu: RuntimeMessage<'ChangeLaunchContextMenu', boolean>
  TryPoker: RuntimeMessage<'TryPoker', string>
}

export async function sendMessage<
  T extends keyof Messages,
>(type: T, payload: Messages[T]['payload']) {
  try {
    await chrome.runtime.sendMessage(
      chrome.runtime.id,
      { type, payload }
    )
  } catch (err) {
    console.error(`sendMessage<${type}> failure:`, err)
    throw err
  }
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
