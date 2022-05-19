import cfg from '../config'
import InitStorage from '../utils/storage'
import { initTitlebarHeight } from './titlebar'

export type Environment = {
  titlebar_height: number
}

const [ loadStorage, saveStorage ] = InitStorage<Environment>(cfg.ENVIRONMENT_STORAGE_KEY)

export const load = () => loadStorage()

export async function init({ window_height, inner_height }: {
  window_height: number,
  inner_height: number
}): Promise<void> {
  const titlebar_height = await initTitlebarHeight(window_height, inner_height)
  const env = {
    titlebar_height
  }

  await saveStorage(env)
}
