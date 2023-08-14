import { Base } from './core/base'

export const isWindowsOS = (platform: Base['platform']) => platform.os === 'win'
export const isMacOS = (platform: Base['platform']) => platform.os === 'mac'

const InitCanIUse = <A extends any[]>(
  fn: (...args: A) => boolean
) => [
  fn,
  function ReceiveArgs(...args: A) {
    return (
      function exec() {
        return fn(...args)
      }
    )
  }
] as const

// 唤回窗只有 Windows 系统才有，而且要开启 【「唤回 Poker」窗口】 的设置项
export const [ canUseRefocusWindow, CanUseRefocusWindow ] = InitCanIUse(
  (platform: Base['platform']) => isWindowsOS(platform)
)

// 利用搜索窗的最小化来还原窗口只有 macOS 系统才有
export const [ canUseMinimizeRevert, CanUseMinimizeRevert ] = InitCanIUse(
  (platform: Base['platform']) => isMacOS(platform)
)
