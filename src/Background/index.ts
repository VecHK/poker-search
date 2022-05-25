import cfg from '../config'
import launchControlWindow from './launch'
import { regRules } from './moble-access'

console.log('Poker Background')

regRules()

// 未启动Poker的控制窗时候，快捷键 focus-layout 为启动 Poker 控制窗
// 在启动控制窗后，快捷键 focus-layout 就不再是 Poker 控制窗了，
// 而是原本的切换到搜索窗和控制窗的快捷键
// 在控制窗关闭后，快捷键 focus-layout 又会激活为启动 Poker 控制窗
const commandHandler = (command: string) => {
  if (command === 'focus-layout') {
    chrome.commands.onCommand.removeListener(commandHandler)
    launchControlWindow({
      text: undefined,
      revert_container_id: undefined
    }).then(({ controlWindow }) => {
      if (controlWindow.id !== undefined) {
        const evHandler = (id: number) => {
          if (id === controlWindow.id) {
            chrome.windows.onRemoved.removeListener(evHandler)
            chrome.commands.onCommand.addListener(commandHandler)
          }
        }
        chrome.windows.onRemoved.addListener(evHandler)
      }
    })
  }
}
chrome.commands.onCommand.addListener(commandHandler)

// omnibox 提交
chrome.omnibox.onInputEntered.addListener((text) => {
  chrome.windows.getCurrent(({ id }) => {
    launchControlWindow({
      text,
      revert_container_id: id
    })
  })
})

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  chrome.omnibox.setDefaultSuggestion({
    // content: 'content',
    description: `Poker搜索: ${text}`,
  })

  // suggest([{
  //   content: 'content',
  //   description: "description",
  // }])
})

chrome.runtime.onInstalled.addListener((details) => {
  const common: chrome.windows.CreateData = {
    type: 'popup',
    width: cfg.INSTALLED_WINDOW_WIDTH,
    height: cfg.INSTALLED_WINDOW_HEIGHT,
    left: 0,
    top: 0,
  }
  if (details.reason === 'install') {
    chrome.windows.create({
      ...common,
      url: chrome.runtime.getURL(`/installed.html`)
    })
  } else if (details.reason === 'update') {
    chrome.windows.create({
      ...common,
      url: chrome.runtime.getURL(`/installed.html?update=1`)
    })
  }
})
