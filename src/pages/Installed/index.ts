import cfg from '../../config'
import { init } from '../../environment'

(async () => {
  try {
    await init({
      windowHeight: cfg.INSTALLED_WINDOW_HEIGHT,
      innerHeight: window.innerHeight,
    })
    window.close()
  } catch (err: any) {
    alert(err.message)
  }
})()

// @ts-ignore:next-line
if (module.hot) module.hot.accept()
