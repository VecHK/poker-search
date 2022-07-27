import React, { ReactNode } from 'react'

import cfg from '../../../../config'

import { ChromeLink } from '../../../../components/ChromeLink'
import ShortcutsKey from '../../../../components/Shortcut'
import SettingItem from '../SettingItem'

import s from './index.module.css'

function CollapseSection({
  title,
  children,
  initOpen = false
}: { title: ReactNode; children: ReactNode; initOpen?: boolean }) {
  return (
    <section className={s.CollapseSection}>
      <details open={initOpen}>
        <summary className={s.CollapseSummary}><dt className={s.CollapseSectionTitle}>{title}</dt></summary>
        <div className={s.CollapseContent}>{children}</div>
      </details>
    </section>
  )
}

function ListItem({ title, children }: Record<'title' | 'children', ReactNode>) {
  return (
    <div className={s.ListItem}>
      <div className={s.ListItemTitle}>{title}</div>
      <div className={s.ListItemContent}>{children}</div>
    </div>
  )
}

export default function Help() {
  return (
    <SettingItem title="使用方法">
      <CollapseSection title="站点的配置">
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

      <CollapseSection title="一键加入 Poker">
        现在，你可以在想要加入到 Poker 的网站中搜索『poker』或『Poker』后，<br />
        再点击地址栏（域名右侧）旁的 Poker 图标，即可立马『添加该站点到 Poker』。
      </CollapseSection>

      <CollapseSection title="召唤Poker">
        <ListItem title="字符串召唤">
          在搜索栏输入『poker + 空格』后激活 Poker 进行搜索。
        </ListItem>
        <ListItem title="图标召唤">
          现可直接点击地址栏旁的插件图标进行搜索。
        </ListItem>
        <ListItem title="快捷键召唤">
          <p>
            在任何时候，可使用 <ShortcutsKey keys={['Ctrl', 'Shift', '1']} />（ mac 的是 <ShortcutsKey keys={['⌘', '⇧', '1']} /> ）直接启动 Poker。
          </p>
          <p>
            由于浏览器的限制，修改快捷键的键位需要去 <ChromeLink url="chrome://extensions/shortcuts/">Chrome 提供的快捷键设置页面</ChromeLink> 中调整。
          </p>
          <p>
            Poker 启动后，若是之后有别的窗口覆盖了 Poker，使用这个快捷键能直接把所有窗口调整回最顶层的状态。
          </p>
        </ListItem>
        <ListItem title="右键召唤">
          在浏览器任意位置右键，可以直接召唤 Poker。并且，你还能直接右键搜索选中的内容。
        </ListItem>
        <ListItem title="唤回Poker">
          <p>
            与此同时，在 Poker 启动后再执行 <b>图标召唤</b>、<b>快捷键召唤</b>、<b>右键召唤</b> 的话，<br />
            能立马呼唤回正在运行的 Poker。
          </p>
          <p>
            也就是说，你可以在 Poker 被其他电脑窗口压在下面时，通过这些方式将 Poker 再次唤回。
          </p>
        </ListItem>
        <ListItem title="试试 Poker！">
          <p>
            在各大搜索引擎中，顶部与底部都添加了『试试 Poker』。<br />
            让你能在搜不出想要结果时，一气之下使用 Poker！
          </p>
        </ListItem>
      </CollapseSection>

      <CollapseSection title="『层』的概念">
        <p>Poker 的交互方式与层息息相关。</p>
        <p>现在，每个层都能命名了，就像一个个文件夹一样。</p>
        <p>与此同时，在搜索前可以只启动特定的页面，让你在最短的时间内获得最相关的结果。</p>
      </CollapseSection>

      <CollapseSection title="单独启动页面">
        <p>
          在地址栏中输入『poker + 空格 + 某网站域名的一部分 + 空格 + 搜索内容』即可立马展开那个网站搜索你想要的内容。
        </p>
        <p>
          此功能并不会展开 Poker，这意味着你知道某个网站一定能检索到你想要的内容时，你能利用 Poker 的字符串转换功能一步到位。
        </p>
      </CollapseSection>


      <CollapseSection title="最大化页面">
        <p>
          现在，除了能利用『新建标签页』直接进入大屏页面外，你还能直接点击相应窗口的『最大化按钮』，让这个窗口进入大屏模式。
          (如果你是 macOS，则是使用最小化按钮)
        </p>

        <p>
          同时，点击其任意一个窗口的『关闭』按钮，所有的 Poker 页面都会关闭。
        </p>
      </CollapseSection>
    </SettingItem>
  )
}
