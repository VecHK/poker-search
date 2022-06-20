import { ChromeEvent } from '../utils/chrome-event'
import launchControlWindow, { controlWindowMemo } from './launch'

// 未启动Poker的控制窗时候，快捷键 focus-layout 为启动 Poker 控制窗
// 在启动控制窗后，快捷键 focus-layout 就不再是 Poker 控制窗了，
// 而是原本的切换到搜索窗和控制窗的快捷键
// 在控制窗关闭后，快捷键 focus-layout 又会激活为启动 Poker 控制窗
export default function GlobalCommand() {
  const [ , , setWatch ] = controlWindowMemo
  setWatch(isLaunched => {
    if (isLaunched) {
      cancelGlobalCommand()
    } else {
      applyGlobalCommand()
    }
  })

  const [applyGlobalCommand, cancelGlobalCommand] = ChromeEvent(
    chrome.commands.onCommand,
    (command) => {
      if (command === 'focus-layout') {
        launchControlWindow({
          text: undefined,
          revert_container_id: undefined
        })
      }
    }
  )

  return [applyGlobalCommand, cancelGlobalCommand] as const
}
