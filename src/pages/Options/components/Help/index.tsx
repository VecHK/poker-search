import React, { ReactNode } from 'react'

import cfg from '../../../../config'

import { ChromeLink } from '../../../../components/ChromeLink'
import ShortcutsKey from '../../../../components/Shortcut'
import SettingItem from '../SettingItem'

import s from './index.module.css'

function CollapseSection({
  title,
  children,
  initOpen = true
}: { title: ReactNode; children: ReactNode; initOpen?: boolean }) {
  return (
    <section>
      <details open={initOpen}>
        <summary className="summary"><dt className={s.CollapseSectionTitle}>{title}</dt></summary>
        <div className={s.CollapseContent}>{children}</div>
      </details>
    </section>
  )
}

export default function Help() {
  return (
    <SettingItem title="使用方法">
      <CollapseSection title="快捷键" initOpen={false}>
        <p>
          可使用 <ShortcutsKey keys={['Ctrl', 'Shift', '1']} />（ mac 的是 <ShortcutsKey keys={['⌘', '⇧', '1']} /> ）直接启动 Poker。
        </p>
        <p>
          由于浏览器的限制，修改快捷键的键位需要去 <ChromeLink url="chrome://extensions/shortcuts/">Chrome 提供的快捷键设置页面</ChromeLink> 中调整。
        </p>
        <p>
          Poker 启动后，若是之后有别的窗口覆盖了 Poker，使用这个快捷键能直接把所有窗口调整回最顶层的状态。
        </p>
      </CollapseSection>

      <CollapseSection title="配置站点" initOpen={false}>
        <p>
          直接拖拽右边已经录入网站的方框，能进行发牌的顺序调换。<br />
          点击 + 号能添加新的网站。
        </p>

        <p></p>
        <p>
          添加新网站时，在 URL 中把想要搜索的关键字替换为 <b style={{ color: '#d22a44' }}>{cfg.KEYWORD_REPLACEHOLDER}</b><br />
          例：<br />
          https://www.google.com/search?q=<b style={{ color: '#d22a44' }}>{cfg.KEYWORD_REPLACEHOLDER}</b><br />
          https://www.youtube.com/results?search_query=<b style={{ color: '#d22a44' }}>{cfg.KEYWORD_REPLACEHOLDER}</b><br />
          https://github.com/search?q=<b style={{ color: '#d22a44' }}>{cfg.KEYWORD_REPLACEHOLDER}</b><br />
        </p>
      </CollapseSection>
    </SettingItem>
  )
}
