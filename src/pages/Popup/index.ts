import React from 'react'
import { render } from 'react-dom'

import PopupEntrance from './PopupEntrance'

import './index.css'

render(
  React.createElement(PopupEntrance, {}),
  window.document.querySelector('#app-container')
)

// @ts-ignore:next-line
if (module.hot) module.hot.accept()
