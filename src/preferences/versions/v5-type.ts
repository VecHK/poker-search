// v2.0.0 启用

import { DefinePreferences } from './'

export type URLPattern = string
export type SiteOption = {
  id: string
  icon: string | null
  name: string
  url_pattern: URLPattern
  access_mode: 'DESKTOP' | 'MOBILE' | 'MOBILE-STRONG'
  width_size: number
}
export type SiteSettingFloorID = string
export type SiteSettingFloor = {
  id: SiteSettingFloorID
  name: string
  row: Array<SiteOption>
}
export type SiteSettings = Array<SiteSettingFloor>

export type PreferencesV5 = DefinePreferences<5, {
  // 右键菜单栏【启动Poker】
  launch_poker_contextmenu: boolean

  // 将每一层的页面填充满
  fill_empty_window: boolean

  // 「唤回 Poker」窗口
  refocus_window: boolean

  site_settings: SiteSettings
}>
