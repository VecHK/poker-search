import { Memo } from 'vait'
import cfg from '../../../config'
import { ChromeEvent } from '../../../utils/chrome-event'
import { Limit } from '../../base/limit'

function doNotOperate() {}

type InitRefocusEventReturn<RefocusWindowId> = Readonly<{
  apply: () => void
  cancel: () => void
  refocus_window_id: RefocusWindowId
}>

export async function InitRefocusEvent(
  enableCond: () => boolean,
  limit: Limit,
  callbacks: {
    close: () => void
  }
): Promise<
  InitRefocusEventReturn<undefined> | InitRefocusEventReturn<number>
> {
  if (!enableCond()) {
    return {
      apply: doNotOperate,
      cancel: doNotOperate,
      refocus_window_id: undefined,
    } as const
  } else {
    const { id: refocus_window_id } = await chrome.windows.create({
      url: chrome.runtime.getURL('refocusLayout.html'),
      type: 'popup',
      state: 'normal',
      left: limit.minX,
      top: limit.minY,
      width: cfg.REFOCUS_LAYOUT_WINDOW_WIDTH,
      height: cfg.REFOCUS_LAYOUT_WINDOW_HEIGHT,
    })

    if (refocus_window_id === undefined) {
      throw Error('refocus_window_id is undefined')
    }

    const [ applyRemovedListener, cancelRemovedListener ] = ChromeEvent(
      chrome.windows.onRemoved,
      (removed_win_id) => {
        if (refocus_window_id === removed_win_id) {
          callbacks.close()
        }
      }
    )

    return {
      apply() {
        applyRemovedListener()
      },
      cancel() {
        cancelRemovedListener()
      },
      refocus_window_id
    } as const
  }
}

export function InitRefocusLayoutMemo(enableCond: () => boolean): Readonly<[
  () => boolean, (v: boolean) => void
]> {
  if (enableCond()) {
    return Memo<boolean>(false)
  } else {
    return [() => false, () => undefined] as const
  }
}
