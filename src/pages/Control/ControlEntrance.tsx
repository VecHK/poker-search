import React, { useState } from 'react'
import cfg from '../../config'
import { Base, createBase, RevertContainerID } from '../../core/base'
import getQuery from '../../utils/get-query'
import { saveFilteredFloor } from '../../x-state/filtered-floor'

import Control from './Control'
import './Control.css'

export function getRevertContainerId(): RevertContainerID {
  const revert_container_id_raw = getQuery(cfg.CONTROL_QUERY_REVERT)
  if (revert_container_id_raw === null) {
    return undefined
  } else {
    const revert_container_id = Number(revert_container_id_raw)
    if (Number.isInteger(revert_container_id)) {
      return revert_container_id
    } else {
      throw Error('revert_container_id is not number')
    }
  }
}

export default function Entrance({
  base: firstBase
}: { base: Base }) {
  const [base, setBase] = useState<Base>(firstBase)

  return (
    <Control
      base={base}
      onSelectedFloorChange={(selected_idx_list) => {
        // alert('selectedchange')
        const s_ids = base.preferences.site_settings.map(s => s.id)
        saveFilteredFloor(
          s_ids.filter((_, idx) => {
            return selected_idx_list.indexOf(idx) === -1
          })
        ).then(() => {
          createBase(getRevertContainerId()).then((base) => {
            setBase(base)
          })
        })
      }}
    />
  )
}
