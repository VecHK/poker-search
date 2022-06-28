import { MessageEvent } from '../../message'
import { searchPoker } from './selection-contextmenu'

export default function TryPoker() {
  return (
    MessageEvent('TryPoker', async (search_text, sender) => {
      const revert_container_id = sender.tab?.windowId
      searchPoker(search_text, revert_container_id)
    })
  )
}
