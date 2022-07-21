import React, { useState } from 'react'
import { useMemo } from 'react'
import { useEffect } from 'react'
import cfg from '../../config'
import { Base, createBase, RevertContainerID } from '../../core/base'
import useCurrentWindow from '../../hooks/useCurrentWindow'
import usePreventEnterFullScreen from '../../hooks/usePreventEnterFullScreen'
import getQuery from '../../utils/get-query'
import { saveFilteredFloor } from '../../x-state/filtered-floor'

import Control from './Control'
import './Control.css'

function getRevertContainerId(): RevertContainerID {
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

function useFilteredFloorTips() {
  const [show_tips, setTips] = useState<number | false>(false)

  useEffect(() => {
    if (show_tips !== false) {
      const handler = setTimeout(() => {
        setTips(() => false)
      }, 3000)
      return () => clearTimeout(handler)
    }
  }, [show_tips])

  return [
    function showTips() {
      setTips(Date.now())
    },

    useMemo(() => (
      <div className={`filtered-floor-tips ${show_tips ? 'show' : ''}`}>
        你可能需要重新提交关键字才能应用新选择的层
      </div>
    ), [show_tips])
  ] as const
}

export default function Entrance() {
  const controlWindow = useCurrentWindow()
  usePreventEnterFullScreen(controlWindow?.windowId)

  const [showTips, tips_node] = useFilteredFloorTips()
  const [base, setBase] = useState<Base | undefined>()

  function refreshBase() {
    createBase(getRevertContainerId()).then((base) => {
      setBase(base)
    })
  }

  useEffect(() => {
    refreshBase()
  }, [])

  if (!base || !controlWindow) {
    return <></>
  } else {
    return (
      <>
        <Control
          base={base}
          controlWindowId={controlWindow.windowId}
          onSelectedFloorChange={(selected_idx_list) => {
            const s_ids = base.preferences.site_settings.map(s => s.id)
            const filtered_floor = s_ids.filter((_, idx) => {
              return selected_idx_list.indexOf(idx) === -1
            })
            saveFilteredFloor(filtered_floor).then(() => {
              showTips()
              refreshBase()
            })
          }}
        />

        {tips_node}
      </>
    )
  }
}
