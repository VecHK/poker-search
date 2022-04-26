import React from 'react';
import { render } from 'react-dom';
import cfg, { setTitleBarHeight } from '../../config';

import Control from './Control';
import './Control.css';

function detectTitleBarHeight() {
  return cfg.CONTROL_WINDOW_HEIGHT - window.innerHeight
}
setTitleBarHeight(detectTitleBarHeight())

render(<Control />, window.document.querySelector('#app-container'));

// if (module.hot) module.hot.accept();

// window.onload = () => {
// }
