// chrome.events.Event

export default function ChromeEvent<Fn extends Function>(e: chrome.events.Event<Fn>, fn: Fn) {
  e.addListener(fn)

  return function cancelEvent() {
    e.removeListener(fn)
  }
}
