import React from 'react';
import { render } from 'react-dom';

import Control from './Control';
import './Control.css';

render(<Control />, window.document.querySelector('#app-container'));

// if (module.hot) module.hot.accept();

// window.onload = () => {
// }
