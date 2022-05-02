import React from 'react'
import { render } from 'react-dom'
import { createBase } from '../../utils/base'

import Control from './Control'
import './Control.css'

createBase().then(base => {
  const controlElement = React.createElement(Control, { base })
  render(controlElement, window.document.querySelector('#app-container'));
})

// @ts-ignore:next-line
if (module.hot) module.hot.accept();
