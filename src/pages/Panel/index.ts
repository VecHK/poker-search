import React from 'react'
import { render } from 'react-dom'

import Panel from './Panel'
import './index.css'

render(
  React.createElement(Panel, {}),
  window.document.querySelector('#app-container')
)

// @ts-ignore:next-line
if (module.hot) module.hot.accept()
