import { useCallback, useEffect, useState } from 'react'
import { Atomic, Signal } from 'vait'

import { Base, LayoutInfo } from '../core/base'
import { Matrix } from '../core/common'
import { CreateSearchLayout, SearchLayout } from '../core/layout'
import { renderMatrix } from '../core/layout/render'
import { closeWindows, SearchWindow, WindowID } from '../core/layout/window'

const controlProcessing = Atomic()

export default function useControl(
  base: Base,
  layout_info: LayoutInfo
) {
  const [isLoading, setLoading] = useState(false)

  const [stop_creating_signal] = useState(Signal<void>())
  const [creating_signal] = useState(Signal<void>())

  const [search_layout, setSearchLayout] = useState<SearchLayout | null>(null)

  const closeSearchWindows = useCallback(async (layout: SearchLayout) => {
    if (layout.refocus_window_id === undefined) {
      await Promise.all(closeWindows(layout.getRegIds()))
    } else {
      await Promise.all(closeWindows([layout.refocus_window_id, ...layout.getRegIds()]))
    }
  }, [])

  useEffect(function searchWindowsEventInit() {
    if (search_layout !== null) {
      search_layout.applyAllEvent()
      return () => {
        search_layout.cancelAllEvent()
      }
    }
  }, [closeSearchWindows, search_layout])

  useEffect(function closeAllWindowBeforeUnload() {
    const handler = () => {
      stop_creating_signal.trigger()
      if (search_layout !== null) {
        closeSearchWindows(search_layout)
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => {
      window.removeEventListener('beforeunload', handler)
    }
  }, [closeSearchWindows, search_layout, stop_creating_signal])

  const constructSearchLayout = useCallback((
    control_window_id: WindowID,
    layout_info: LayoutInfo,
    keyword: string,
  ) => {
    console.log('refreshWindows')
    setLoading(true)

    const closeHandler = () => {
      stop_creating_signal.trigger()
      window.close()
    }
    creating_signal.receive(closeHandler)

    return (
      CreateSearchLayout({
        control_window_id,
        base,
        layout_info,
        keyword,
        stop_creating_signal,
        creating_signal,
        async onRefocusLayoutClose() {
          window.close()
        },
        async onRemovedWindow() {
          window.close()
        },
      }).then(new_layout => {
        setSearchLayout(new_layout)
      }).catch(err => {
        if (err.cancel) {
          // 提前取消
          console.log('提前取消')
        } else {
          console.error('CreateSearchLayout error', err)
          throw err
        }
      }).finally(() => {
        creating_signal.unReceive(closeHandler)
        setLoading(false)
      })
    )
  }, [base, creating_signal, stop_creating_signal])

  return {
    isLoading,
    setLoading,
    search_layout,
    setSearchLayout,
    closeSearchWindows,
    constructSearchLayout,
    controlProcessing,
    changeRow: useChangeRow(base, layout_info, search_layout),
  } as const
}

function useChangeRow(base: Base, layout_info: LayoutInfo, search_layout: SearchLayout | null) {
  return (
    useCallback(async (type: 'previus' | 'next') => {
      console.log('changeRow', type, search_layout)
      if (search_layout === null) {
        return
      }
      return (
        controlProcessing(async () => {
          try {
            search_layout.cancelAllEvent()

            const remainMatrix = [...search_layout.getMatrix()]
            const latestRow = type === 'next' ? remainMatrix.pop() : remainMatrix.shift()

            let newMatrix: Matrix<SearchWindow>

            if (latestRow === undefined) {
              throw Error('latestRow is undefined')
            } else if (type === 'next') {
              newMatrix = [latestRow, ...remainMatrix]
            } else {
              newMatrix = [...remainMatrix, latestRow]
            }

            await renderMatrix(
              base,
              layout_info,
              newMatrix,
              type === 'next' ? true : undefined,
              true
            )

            // await focusControlWindow()

            search_layout.setMatrix(newMatrix)
          } finally {
            search_layout.applyAllEvent()
          }
        })
      )
    }, [base, search_layout, layout_info])
  )
}
