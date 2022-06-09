import { createMemo } from 'vait'
import { FocusChanged, sendMessage } from '../message'

function devLog(message?: any, ...optionalParams: any[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, ...optionalParams)
  }
}

devLog('Poker Content Script works!')

const [, setFocus] = createMemo(false)

function send(val: boolean) {
  setFocus(val)

  sendMessage<FocusChanged>({
    type: 'focus-changed',
    payload: val,
  }).catch((err) => {
    // ignore
    devLog('sendMessageError', err)
  })
}

function blurHandler() {
  devLog('poker content-script blur')
  send(false)
}

function focushandler() {
  devLog('poker content-script focus')
  send(true)
}

window.addEventListener('blur', blurHandler, false)
window.addEventListener('focus', focushandler, false)
