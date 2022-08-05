import { useEffect } from 'react'
import { SearchLayout } from '../../../core/layout'
import { WindowID } from '../../../core/layout/window'
import { MessageEvent } from '../../../message'

export default function useFocusControlMessage(
  window_id: WindowID,
  search_layout: SearchLayout | null
) {
  useEffect(() => {
    const [ applyRefocusEvent, cancelRefocusEvent ]= MessageEvent('FocusControl', () => {
      if (search_layout !== null) {
        search_layout.cancelAllEvent()
        search_layout.refreshLayout([]).finally(() => {
          search_layout.applyAllEvent()
        })
      } else {
        chrome.windows.update(window_id, { focused: true })
      }
    })

    applyRefocusEvent()

    return cancelRefocusEvent
  }, [search_layout, window_id])
}
