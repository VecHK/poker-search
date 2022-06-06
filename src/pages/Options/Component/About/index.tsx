import pkg from '../../../../../package.json'

import React from 'react'
import SettingItem from '../SettingItem'

export default function About() {
  return (
    <SettingItem title="关于">
      <p>
        遇到了麻烦/故障？请上 <a href={pkg.bugs.url} target="_blank" rel="noreferrer">GitHub issues</a> 反馈
      </p>
      <p>
        Inspiried by <a href="https://www.smartisan.com/tnt/os" target="_blank" rel="noreferrer">Smartisian TNT</a> Poker Dealer<br />
        Made by <a href="http://vec.moe" target="_blank" rel="noreferrer">Vec</a><br />
        Designed by <a href="https://t.me/nt_cubic" target="_blank" rel="noreferrer">NT³</a>
      </p>
    </SettingItem>
  )
}
