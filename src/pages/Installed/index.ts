import cfg from '../../config'
import { initEnvironment } from '../../environment'

(async () => {
  try {
    await initEnvironment({
      window_height: cfg.INSTALLED_WINDOW_HEIGHT,
      inner_height: window.innerHeight,
    })
    window.close()
  } catch (err: any) {
    alert(err.message)
  }
})()

// @ts-ignore:next-line
if (module.hot) module.hot.accept()
