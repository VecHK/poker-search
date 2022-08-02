import React from 'react'
import { focusControlWindow } from '../../core/control-window'

import s from './RefocusLayout.module.css'

const Popup = () => {
  return (
    <div className={s.App}>
      <AppMain />
    </div>
  )
}

function AppMain() {
  return (
    <footer className={s.AppMain}>
      <button
        className={s.Button}
        onClick={(e) => {
          e.preventDefault()
          focusControlWindow()
        }}
      >唤回 Poker</button>
    </footer>
  )
}

export default Popup
