import { Memo } from 'vait'

export class ChromeEventError extends Error {}

export const ChromeEvent = <Fn extends Function>(
  ev: chrome.events.Event<Fn>,
  processFn: Fn
) => {
  const [ isApplied, setApply ] = Memo(false)
  return [
    function applyEvent() {
      if (isApplied()) {
        throw new ChromeEventError('cannot apply chrome-event because Listener is Applied')
      } else {
        setApply(true)
        ev.addListener(processFn)
      }
    },

    function cancelEvent() {
      if (isApplied()) {
        setApply(false)
        ev.removeListener(processFn)
      } else {
        console.warn(
          new ChromeEventError('cannot cancel chrome-event because Listener is canceled')
        )
      }
    }
  ] as const
}

export function ApplyChromeEvent<Fn extends Function>(
  ev: chrome.events.Event<Fn>,
  processFn: Fn
) {
  const [ applyEvent, cancelEvent ] = ChromeEvent(ev, processFn)

  applyEvent()

  return cancelEvent
}
