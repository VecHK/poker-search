import { Atomic } from 'vait'
import { clearMobileIdentifier } from '../../preferences/site-settings'
import { ApplyChromeEvent } from '../../utils/chrome-event'
import { Base } from '../base'
import { getSearchWindowTabURL, getWindowId, WindowID } from './window'

const revertOperate = Atomic()

export default function WindowRevert(base: Base) {
  const { getRevertContainerId, setRevertContainerId } = base

  return (
    async function revert(search_window_id: WindowID): Promise<void> {
      revertOperate(async () => {
        const url_P = getSearchWindowTabURL(search_window_id)

        const revert_container_id = getRevertContainerId()
        if (revert_container_id !== undefined) {
          await chrome.windows.update(search_window_id, {
            state: 'normal'
          })

          await Promise.all([
            chrome.tabs.create({
              url: clearMobileIdentifier(await url_P),
              windowId: revert_container_id
            }),
            chrome.windows.update(revert_container_id, { focused: true })
          ])
        } else {
          await chrome.windows.update(search_window_id, {
            state: 'normal',
            focused: true,
          })

          const new_window = await chrome.windows.create({
            url: clearMobileIdentifier(await url_P),
            state: 'normal',
            focused: true,
          })

          const new_window_id = getWindowId(new_window)
          setRevertContainerId(new_window_id)
          const cancelEvent = ApplyChromeEvent(chrome.windows.onRemoved, closed_id => {
            if (closed_id === new_window_id) {
              cancelEvent()
              setRevertContainerId(undefined)
            }
          })
        }
      })
    }
  )
}
