import React from 'react'
import { render } from 'react-dom'
import { Base, createBase } from '../../utils/base'

import Control from './Control'
import './Control.css'

function renderReactApp(base: Base) {
  const controlElement = React.createElement(Control, { base })
  return render(controlElement, window.document.querySelector('#app-container'));
}

export default async function launch(){
  const base = await createBase(true)
  renderReactApp(base)
}
