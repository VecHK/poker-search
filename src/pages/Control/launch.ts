import React from 'react'
import { render } from 'react-dom'
import cfg, { setTitleBarHeight } from '../../config'
import { Base, initBase } from '../../utils/base'
import { getSearchPatternList } from '../../utils/search'

import Control from './Control'
import './Control.css'

function renderReactApp(base: Base) {
  const controlElement = React.createElement(Control, { base })
  return render(controlElement, window.document.querySelector('#app-container'));
}

function detectTitleBarHeight() {
  return cfg.CONTROL_WINDOW_HEIGHT - window.innerHeight
}

export default async function launch(){
  const titleBarHeight = detectTitleBarHeight()
  setTitleBarHeight(detectTitleBarHeight())

  const base = await initBase({
    windowWidth: cfg.SEARCH_WINDOW_WIDTH,
    windowHeight: cfg.SEARCH_WINDOW_HEIGHT,
    gapHorizontal: cfg.SEARCH_WINDOW_GAP_HORIZONTAL,
    titleBarHeight,
    searchPatternList: getSearchPatternList()
  })
  renderReactApp(base)
}
