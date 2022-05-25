export default function AddChromeEvent<Fn extends Function>(
  ev: chrome.events.Event<Fn>,
  processFn: Fn
) {
  ev.addListener(processFn)

  return function cancelEvent() {
    ev.removeListener(processFn)
  }
}
