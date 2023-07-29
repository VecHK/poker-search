import { Memo } from 'vait'
import cfg from '../../../config'
import { ChromeEvent } from '../../../utils/chrome-event'
import { Base } from '../../base'

function getRefocusWindowHeight(has_strong_mobile_mode: boolean) {
  if (has_strong_mobile_mode) {
    return cfg.REFOCUS_LAYOUT_WINDOW_HEIGHT_WITH_DEBUGGER
  } else {
    return cfg.REFOCUS_LAYOUT_WINDOW_HEIGHT_WITH_NORMAL
  }
}

function doNotOperate() {}

type InitRefocusEventReturn<RefocusWindowId> = Readonly<{
  apply: () => void
  cancel: () => void
  refocus_window_id: RefocusWindowId
}>

export async function InitRefocusEvent(
  enableCond: () => boolean,
  has_strong_mobile_mode: boolean,
  base: Base,
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
      left: base.limit.minX,
      top: base.limit.minY,
      width: cfg.REFOCUS_LAYOUT_WINDOW_WIDTH,
      height: getRefocusWindowHeight(has_strong_mobile_mode),
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
