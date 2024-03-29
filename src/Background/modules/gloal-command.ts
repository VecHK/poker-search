import { callControlWindow } from '../../core/control-window'
import { ChromeEvent } from '../../utils/chrome-event'

// 未启动Poker的控制窗时候，快捷键 focus-layout 为启动 Poker 控制窗
// 在启动控制窗后，快捷键 focus-layout 不进行任何操作
// 因为这时候，控制窗监听着 focus-layout 的快捷键，用于唤回 Poker Layout
export default function GlobalCommand() {
  const [applyGlobalCommand, cancelGlobalCommand] = ChromeEvent(
    chrome.commands.onCommand,
    (command) => {
      if (command === 'focus-layout') {
        console.log('call poker command')
        callControlWindow()
      }
    }
  )

  return [applyGlobalCommand, cancelGlobalCommand] as const
}
