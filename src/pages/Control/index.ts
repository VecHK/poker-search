import React from 'react'
import { render } from 'react-dom'
import { createBase } from '../../core/base'

import './Control.css'
import ControlEntrance, { getRevertContainerId } from './ControlEntrance'

createBase(getRevertContainerId()).then(base => {
  const entranceElement = React.createElement(ControlEntrance, { base })
  render(entranceElement, window.document.querySelector('#app-container'));
})

// @ts-ignore:next-line
if (module.hot) module.hot.accept();
