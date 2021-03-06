import { useCallback, useEffect, useState } from 'react'
import { Atomic, Signal } from 'vait'

import { Base, LayoutInfo } from '../core/base'
import { Matrix } from '../core/common'
import { CreateSearchLayout } from '../core/layout'
import { renderMatrix } from '../core/layout/render'
import { closeWindows, SearchWindow, WindowID } from '../core/layout/window'

export type Control = Unpromise<ReturnType<typeof CreateSearchLayout>>

const controlProcessing = Atomic()

export default function useControl(
  base: Base,
  layout_info: LayoutInfo
) {
  const [isLoading, setLoading] = useState(false)

  const [stop_creating_signal] = useState(Signal<void>())
  const [creating_signal] = useState(Signal<void>())

  const [control, setControl] = useState<Control | null>(null)

  const closeSearchWindows = useCallback(async (con: Control) => {
    if (con.refocus_window_id === undefined) {
      await Promise.all(closeWindows(con.getRegIds()))
    } else {
      await Promise.all(closeWindows([con.refocus_window_id, ...con.getRegIds()]))
    }
  }, [])

  useEffect(function searchWindowsEventInit() {
    if (control !== null) {
      control.applyAllEvent()
      return () => {
        control.cancelAllEvent()
      }
    }
  }, [closeSearchWindows, control])

  useEffect(function closeAllWindowBeforeUnload() {
    const handler = () => {
      stop_creating_signal.trigger()
      if (control !== null) {
        closeSearchWindows(control)
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => {
      window.removeEventListener('beforeunload', handler)
    }
  }, [closeSearchWindows, control, stop_creating_signal])

  const refreshWindows = useCallback((
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
      }).then(newControl => {
        setControl(newControl)
      }).catch(err => {
        if (err.cancel) {
          // ????????????
          console.log('????????????')
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
    control,
    setControl,
    closeSearchWindows,
    refreshWindows,
    controlProcessing,
    changeRow: useChangeRow(base, layout_info, control),
  } as const
}

function useChangeRow(base: Base, layout_info: LayoutInfo, control: Control | null) {
  return (
    useCallback(async (type: 'previus' | 'next') => {
      console.log('changeRow', type, control)
      if (control === null) {
        return
      }
      return (
        controlProcessing(async () => {
          try {
            control.cancelAllEvent()

            const remainMatrix = [...control.getMatrix()]
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

            control.setMatrix(newMatrix)
          } finally {
            control.applyAllEvent()
          }
        })
      )
    }, [base, control, layout_info])
  )
}
