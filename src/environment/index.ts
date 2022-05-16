import cfg from '../config'
import InitStorage from '../utils/storage'
import { calcTitleBarHeight } from './titlebar'

export type Environment = {
  titlebar_height: number
}

const [ loadStorage, saveStorage ] = InitStorage<Environment>(cfg.ENVIRONMENT_STORAGE_KEY)

export const load = () => loadStorage()

export async function init({ window_height, inner_height }: {
  window_height: number,
  inner_height: number
}): Promise<void> {
  const titlebar_height = calcTitleBarHeight(window_height, inner_height)
  const env = {
    titlebar_height
  }

  await saveStorage(env)
}
