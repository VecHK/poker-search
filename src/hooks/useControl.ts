import { useCallback, useEffect, useState } from 'react'
import { Atomic, Lock, Signal } from 'vait'

import { Base } from '../core/base'
import { Matrix } from '../core/common'
import { createSearchLayout } from '../core/layout'
import { renderMatrix } from '../core/layout/render'
import { closeWindows, SearchWindow } from '../core/layout/window'

export type Control = Unpromise<ReturnType<typeof createSearchLayout>>

const controlProcessing = Atomic()

export default function useControl(base: Base) {
  const [isLoading, setLoading] = useState(false)

  const [stop_creating_signal] = useState(Signal<void>())
  const [creating_signal] = useState(Signal<void>())

  const [control, setControl] = useState<Control | null>(null)

  const cleanControl = useCallback(async (con: Control) => {
    con.cancelAllEvent()

    await Promise.all(closeWindows(con.getRegIds()))

    if (con.refocus_window_id !== undefined) {
      await Promise.all(closeWindows([con.refocus_window_id]))
    }
  }, [])

  useEffect(function controlEffect() {
    if (control !== null) {
      control.applyAllEvent()
      return () => {
        cleanControl(control)
      }
    }
  }, [cleanControl, control])

  useEffect(function closeAllWindowBeforeUnload() {
    const handler = () => {
      stop_creating_signal.trigger()
      if (control !== null) {
        cleanControl(control)
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => {
      window.removeEventListener('beforeunload', handler)
    }
  }, [cleanControl, control, stop_creating_signal])

  useEffect(function controlEventsEffect() {
    if (control !== null) {
      control.applyAllEvent()
      return () => control.cancelAllEvent()
    }
  }, [control])

  const refreshWindows = useCallback((control_window_id: number, keyword: string) => {
    console.log('refreshWindows')
    setLoading(true)

    const closeHandler = () => {
      stop_creating_signal.trigger()
      window.close()
    }
    creating_signal.receive(closeHandler)

    return (
      createSearchLayout({
        control_window_id,
        base,
        keyword,
        stop_creating_signal,
        creating_signal,
        onRefocusLayoutClose() {
          window.close()
          const [neverResolve] = Lock<void>()
          return neverResolve
        },
        onRemovedWindow() {
          window.close()
          const [neverResolve] = Lock<void>()
          return neverResolve
        },
      }).then(newControl => {
        setControl(newControl)
      }).catch(err => {
        if (err.cancel) {
          // 提前取消
          console.log('提前取消')
        } else {
          console.error('createSearchLayout error', err)
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
    refreshWindows,
    controlProcessing,
    changeRow: useChangeRow(base, control),
  } as const
}

function useChangeRow(base: Base, control: Control | null) {
  return (
    useCallback((type: 'previus' | 'next') => {
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
    }, [base, control])
  )
}
