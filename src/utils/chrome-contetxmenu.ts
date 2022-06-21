import { ChromeEvent } from './chrome-event'

export function ChromeContextMenus(
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

  return {
    presetContextMenu() {
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
    },

    removeContextMenu() {
      chrome.contextMenus.remove(opts.id, () => {
        if (chrome.runtime.lastError) {
          console.error('chrome.contextMenus.remove Error', chrome.runtime.lastError)
        }
      })
    },

    applyClickedEvent,
    cancelClickedEvent,
  } as const
}

export function ApplyChromeContextMenus(
  opts: Readonly<{
    id: string
    contexts: chrome.contextMenus.ContextType[],
    title: string
  }>,
  callback: (d: chrome.contextMenus.OnClickData, t: chrome.tabs.Tab | undefined) => void
) {
  const {
    presetContextMenu,
    removeContextMenu,
    applyClickedEvent,
    cancelClickedEvent,
  } = ChromeContextMenus(opts, callback)

  return [
    function apply() {
      presetContextMenu()
      applyClickedEvent()
    },

    function cancel() {
      removeContextMenu()
      cancelClickedEvent()
    }
  ] as const
}
