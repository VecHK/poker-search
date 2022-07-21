import { useState } from 'react'
import { Base } from '../../core/base'
import { toSelectedFloorIdx } from './utils'

export default function useSelectedFloorIdx(base: Base) {
  const s_ids = base.preferences.site_settings.map(s => s.id)
  const [selected_floor_idx, setSelectedFloorIdx] = useState<number[]>(
    toSelectedFloorIdx(
      s_ids,
      base.init_filtered_floor
    )
  )

  return [ selected_floor_idx, setSelectedFloorIdx ] as const
}
