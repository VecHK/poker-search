function calcTitleBarHeight(
  windowHeight: number,
  innerHeight: number
) {
  return windowHeight - innerHeight
}

async function getTitleBarHeight(): Promise<number | null> {
  const window = await chrome.windows.create({
    type: 'popup',
    focused: true,
    url: 'http://example.com',
    width: 300,
    height: 300,
  })

  try {
    if (window.tabs === undefined) {
      return null
    } else {
      const tab = window.tabs[0]
      const inner_height = tab.height
      const window_height = window.height

      if (inner_height === undefined) {
        return null
      }
      else if (window_height === undefined) {
        return null
      }
      else {
        return calcTitleBarHeight(window_height, inner_height)
      }
    }
  } finally {
    const { id } = window
    if (id !== undefined) {
      await chrome.windows.remove(id)
    }
  }
}

async function _initTitlebarHeight(
  window_height: number, inner_height: number
): Promise<number> {
  const titlebar_height = await getTitleBarHeight()
  if (titlebar_height !== null) {
    return titlebar_height
  } else {
    return calcTitleBarHeight(window_height, inner_height)
  }
}

export async function initTitlebarHeight(
  window_height: number,
  inner_height: number,
): Promise<number> {
  const [titlebar_height, platform] = await Promise.all([
    _initTitlebarHeight(window_height, inner_height),
    chrome.runtime.getPlatformInfo(),
  ])

  if (platform.os === 'win') {
    // 在 Windows 中，创建一个 480px 高度的窗口，实际测量得到的是 473px
    // 为了补正这个误差，故减去 7
    // 除此问题，还要减 1，这是窗口边框的误差
    // ref: https://stackoverflow.com/questions/44168019/get-chrome-browser-height-or-nav-menu-toolbars-height
    return titlebar_height - 7 - 1
  } else {
    // 在 macOS 中，不存在前面 Windows 中的情况，标题栏的高度可以正确取得
    // 但是不清楚在 linux 的情况下会如何，这是需要去调查的问题
    return titlebar_height
  }
}
