import cfg from '../config'
import InitStorage from '../utils/storage'
import { calcTitleBarHeight } from './title-bar'

type Environment = {
  titleBarHeight: number
}

const [ loadStorage, saveStorage ] = InitStorage<Environment>(cfg.ENVIRONMENT_STORAGE_KEY)

export const load = () => loadStorage()

export async function init({ windowHeight, innerHeight }: {
  windowHeight: number,
  innerHeight: number
}): Promise<void> {
  const titleBarHeight = calcTitleBarHeight(windowHeight, innerHeight)
  const env = {
    titleBarHeight
  }

  await saveStorage(env)
}
