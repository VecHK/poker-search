export const ChromeEvent = <Fn extends Function>(
  ev: chrome.events.Event<Fn>,
  processFn: Fn
) => [
  () => ev.addListener(processFn),
  () => ev.removeListener(processFn)
] as const

export function ApplyChromeEvent<Fn extends Function>(
  ev: chrome.events.Event<Fn>,
  processFn: Fn
) {
  const [ applyEvent, cancelEvent ] = ChromeEvent(ev, processFn)

  applyEvent()

  return cancelEvent
}
