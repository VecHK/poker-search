import React from 'react'
import { render } from 'react-dom'

import Popup from './Popup'
import './index.css'

render(
  React.createElement(Popup, {}),
  window.document.querySelector('#app-container')
)

// @ts-ignore:next-line
if (module.hot) module.hot.accept()
