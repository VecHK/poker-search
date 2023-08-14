import { useCallback } from 'react'
import { Atomic } from 'vait'
import { Base, LayoutInfo } from '../../../core/base'
import { Matrix } from '../../../core/common'
import { SearchLayout } from '../../../core/layout'
import { renderMatrix } from '../../../core/layout/render'
import { SearchWindow } from '../../../core/layout/window'

type AtomicTasking = ReturnType<typeof Atomic>

export default function useChangeRow(
  controlProcessing: AtomicTasking,
  base: Base,
  layout_info: LayoutInfo,
  search_layout: SearchLayout | null
) {
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
              base.platform,
              base.limit,
              layout_info,
              newMatrix,
              {
                preset_focused: type === 'next' ? true : undefined,
                reset_size: true
              }
            )

            search_layout.setMatrix(newMatrix)
          } finally {
            search_layout.applyAllEvent()
          }
        })
      )
    }, [base, controlProcessing, layout_info, search_layout])
  )
}
