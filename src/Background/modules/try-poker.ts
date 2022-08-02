import { submitSearch } from '../../core/control-window'
import { MessageEvent } from '../../message'

export default function TryPoker() {
  return (
    MessageEvent('TryPoker', async (search_text, sender) => {
      const revert_container_id = sender.tab?.windowId
      submitSearch(search_text, revert_container_id)
    })
  )
}
