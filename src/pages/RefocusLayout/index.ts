import React from 'react'
import { render } from 'react-dom'

import RefocusLayout from './RefocusLayout'
import './index.css'

render(
  React.createElement(RefocusLayout, {}),
  window.document.querySelector('#app-container')
)

// @ts-ignore:next-line
if (module.hot) module.hot.accept()
