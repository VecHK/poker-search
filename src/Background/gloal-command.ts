import { ChromeEvent } from '../utils/chrome-event'
import { controlIsLaunched } from '../x-state/control-window-launched'
import launchControlWindow from './launch'

// 未启动Poker的控制窗时候，快捷键 focus-layout 为启动 Poker 控制窗
// 在启动控制窗后，快捷键 focus-layout 就不再是 Poker 控制窗了，
// 而是原本的切换到搜索窗和控制窗的快捷键
// 在控制窗关闭后，快捷键 focus-layout 又会激活为启动 Poker 控制窗
export default function GlobalCommand() {
  const [applyGlobalCommand, cancelGlobalCommand] = ChromeEvent(
    chrome.commands.onCommand,
    async (command) => {
      if (command === 'focus-layout') {
        const is_launched = await controlIsLaunched()
        if (!is_launched) {
          launchControlWindow({
            text: undefined,
            revert_container_id: undefined
          })
        } else {
          console.warn('control window is launched')
        }
      }
    }
  )

  return [applyGlobalCommand, cancelGlobalCommand] as const
}
