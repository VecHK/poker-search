import React from 'react'
import SettingHeader from './Component/SettingHeader'
import SettingItem from './Component/SettingItem'
import SettingLink from './Component/SettingLink'
import SettingSwitch from './Component/SettingSwitch'
import SiteOptionManage from './Component/SiteOptionManage'
import './Options.css'

import { version } from '../../../package.json'

const OptionsPage: React.FC<{}> = () => {
  return (
    <div className="OptionsContainer">
      <div className="OptionsInner">
        <SettingHeader version={version} />

        <SettingItem><SettingLink title="关于" /></SettingItem>
        <SettingItem><SettingLink title="使用方式" /></SettingItem>

        <SettingItem>
          <SettingSwitch
            title="使用 Poker 关键字启动搜索"
            description="在搜索栏中输入「Poker + 空格 + 想要搜索的内容」才使用发牌手"
          />
        </SettingItem>

        <SettingItem title="发牌页面管理">
          <SiteOptionManage />
        </SettingItem>
      </div>
    </div>
  )
}

export default OptionsPage
