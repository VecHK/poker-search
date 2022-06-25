import { Base } from './core/base'

const isWindowsOS = (platform: Base['platform']) => platform.os === 'win'
// const isMacOS = (platform: Base['platform']) => platform.os === 'mac'

const InitCompatibility = <A extends any[]>(
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
export const [ canUseRefocusWindow, CanUseRefocusWindow ] = InitCompatibility(
  (platform: Base['platform']) => isWindowsOS(platform)
)
