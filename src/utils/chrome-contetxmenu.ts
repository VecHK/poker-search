import { ChromeEvent } from './chrome-event'

export default function ChromeContextMenus(
  opts: Readonly<{
    id: string
    contexts: chrome.contextMenus.ContextType[],
    title: string
  }>,
  callback: (d: chrome.contextMenus.OnClickData, t: chrome.tabs.Tab | undefined) => void
) {
  const [ applyClickedEvent, cancelClickedEvent ] = ChromeEvent(
    chrome.contextMenus.onClicked,
    (clickData, tab) => {
      console.log('ContentMenu clicked:', clickData.menuItemId)
      if (opts.id === clickData.menuItemId) {
        callback(clickData, tab)
      }
    },
  )

  return [
    function appendContenxtMenu() {
      chrome.contextMenus.create({
        enabled: true,
        id: opts.id,
        contexts: opts.contexts,
        title: opts.title
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('chrome.contextMenus.create Error', chrome.runtime.lastError)
        }
      })
      applyClickedEvent()
    },

    function removeContextMenu() {
      chrome.contextMenus.remove(opts.id, () => {
        if (chrome.runtime.lastError) {
          console.error('chrome.contextMenus.remove Error', chrome.runtime.lastError)
        }
      })
      cancelClickedEvent()
    }
  ] as const
}
