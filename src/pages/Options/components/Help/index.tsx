import { indexOf, map, remove } from 'ramda'
import React, { Fragment, ReactNode } from 'react'

import cfg from '../../../../config'

import { ChromeLink } from '../../../../components/ChromeLink'
import ShortcutsKey from '../../../../components/Shortcut'
import SettingItem from '../SettingItem'

import s from './index.module.css'
import { specify_floor_prefixs } from '../../../../hooks/useSearchForm'

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

function InputContent({ text }: { text: string }) {
  return (
    <code style={{ background: 'rgba(0, 0, 0, 0.1)', fontFamily: 'sans-serif' }}>{text}</code>
  )
}

function KeywordReplaceholder() {
  return <b style={{ color: '#d22a44' }}>{cfg.KEYWORD_REPLACEHOLDER}</b>
}
function KeywordReplaceholder64() {
  return <b style={{ color: '#d22a44' }}>{cfg.KEYWORD_REPLACEHOLDER_WITH_BASE64}</b>
}

export default function Help() {
  return (
    <SettingItem title="使用方法">
      <CollapseSection title="如何将网站加入 Poker？">
        <p>
          你可以在想要加入到 Poker 的网站中搜索『poker』或『Poker』后，<br />
          再点击地址栏（域名右侧）旁的 Poker 图标，即可立马『添加该站点到 Poker』。
        </p>
        <p>
          或者，点击 + 号进行手动加入。
        </p>

        <p></p>
        <p>
          添加新网站时，在 URL 中把想要搜索的关键字替换为 <KeywordReplaceholder /><br />
          例：<br />
          https://www.google.com/search?q=<KeywordReplaceholder /><br />
          https://www.youtube.com/results?search_query=<KeywordReplaceholder /><br />
          https://github.com/search?q=<KeywordReplaceholder /><br />
        </p>
        <p>
          如果你发现 <KeywordReplaceholder /> 是 base64 格式的话，需要将 <KeywordReplaceholder /> 写成 <KeywordReplaceholder64 />
        </p>
      </CollapseSection>

      <CollapseSection title="如何启用 Poker？">
        <ListItem title="地址栏启动">
          在浏览器的地址栏输入『poker + 空格』后激活 Poker 进行搜索。
        </ListItem>
        <ListItem title="图标启动">
          现可直接点击地址栏旁的插件图标进行搜索。
        </ListItem>
        <ListItem title="快捷键启动">
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
        <ListItem title="右键启动">
          在浏览器任意位置右键，可以直接召唤 Poker。并且，你还能直接右键搜索选中的内容。
        </ListItem>
        <ListItem title="唤回 Poker">
          <p>
            与此同时，在 Poker 启动后再执行 <b>图标启动</b>、<b>快捷键启动</b>、<b>右键启动</b> 的话，<br />
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

      <CollapseSection title="如何只显示想要的搜索窗口">
        <p>
          一次弹出太多窗口了，有大半都是无关内容！<br />
          我能不能只启用想要的搜索窗口，提高搜索速度？
        </p>
        <p>
          启用 Poker 后，你能看到输入框下有一条由若干线段组成的长条。<br />
          每一个点对应着页面右侧的一整栏，这一整栏又被称之为『楼层』，你能对每个『楼层』都起一个相应的名字以便分类与记忆。
        </p>
        <p>
          点击这些点会使这块区域留空，留空表示不想在搜索后出现这一楼层。<br />
          还可以滑动选择这些点，可以很快选到自己想要的楼层。<br />
          你甚至可以不动鼠标，直接在输入框中，输入 <InputContent text="/楼层 xxx" />，<br />
          即可选中所有叫『楼层』的层来搜索xxx。<br />
          除了『/』，你还可以使用 {
            map(
              (ch: string) => <Fragment key={ch}>『{ch}』</Fragment>,
              remove(indexOf('/', specify_floor_prefixs), 1, specify_floor_prefixs)
            )
          } 这些字符。同时空格字符也可以是全角的。
        </p>

        <p>这些能让你在想搜索特定内容时，更快地选择到最相关的网站。</p>
      </CollapseSection>

      <CollapseSection title="单独搜索特定网站的方法">
        <p>
          在地址栏中输入 <InputContent text="poker (某网站域名的一部分) (搜索内容)" /> 即可直接跳转到那个网站中搜索你想要的内容。
        </p>
        <p>
          此功能并没有启动 Poker 主窗口，它只是从站点配置中找到匹配好的域名并跳转过去而已。
        </p>
      </CollapseSection>

      <CollapseSection title="将搜索的窗口还原为普通浏览器窗口">
        <p>只要点击窗口自身的最大化按钮即可(如果你是 macOS，则是使用最小化按钮)</p>
        <p>
          同时，点击其任意一个窗口的『关闭』按钮，所有的 Poker 页面都会关闭。
        </p>
      </CollapseSection>
    </SettingItem>
  )
}
