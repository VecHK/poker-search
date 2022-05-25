import React from 'react'
import { render } from 'react-dom'
import cfg from '../../config'
import { createBase, RevertContainerID } from '../../core/base'
import getQuery from '../../utils/get-query'

import Control from './Control'
import './Control.css'

function revertContainerId(): RevertContainerID {
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

createBase(revertContainerId()).then(base => {
  const controlElement = React.createElement(Control, { base })
  render(controlElement, window.document.querySelector('#app-container'));
})

// @ts-ignore:next-line
if (module.hot) module.hot.accept();
