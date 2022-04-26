import React from 'react'
import { render } from 'react-dom'

import Options from './Options'
import './index.css'

render(
  React.createElement(Options, { title: 'Settings' }),
  window.document.querySelector('#app-container')
)

// @ts-ignore:next-line
if (module.hot) module.hot.accept()
