import React from 'react'
import { render } from 'react-dom'
import ControlEntrance from './ControlEntrance'

import './Control.css'

const entranceElement = React.createElement(ControlEntrance)
render(entranceElement, window.document.querySelector('#app-container'));

// @ts-ignore:next-line
if (module.hot) module.hot.accept();
