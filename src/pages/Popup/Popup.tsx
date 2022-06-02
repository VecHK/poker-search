import { Atomic } from 'vait'
import React, { useState } from 'react'

import launchControlWindow from '../../Background/launch'

import useCurrentWindowId from '../../hooks/useCurrentWindowId'
import useWindowFocus from '../../hooks/useWindowFocus'

import { validKeyword } from '../../utils/search'

import SearchForm from '../Control/components/SearchForm'
import './Popup.css'

const processing = Atomic()

const Popup = () => {
  return (
    <div className="App">
      <AppMain />
      <AppFooter />
    </div>
  )
}

function AppMain() {
  const [input, setInput] = useState('')
  const current_window_id = useCurrentWindowId()
  const windowIsFocus = useWindowFocus(true)

  return (
    <main className="App-main">
      <SearchForm
        keyword={input}
        keywordPlaceholder="请输入搜索词"
        setKeyword={setInput}
        submitButtonActive={windowIsFocus}
        onSubmit={({ keyword: newSearchKeyword }) => {
          console.log('onSubmit', newSearchKeyword)
          if (validKeyword(newSearchKeyword)) {
            if (current_window_id !== null) {
              processing(async () => {
                await launchControlWindow({
                  text: newSearchKeyword,
                  revert_container_id: current_window_id
                })
                window.close()
              })
            }
          }
        }}
      />
    </main>
  )
}

function AppFooter() {
  return (
    <footer className="App-footer">
      <a
        href={chrome.runtime.getURL('options.html')}
        target="_blank"
        rel="noreferrer"
      >打开 Poker 设置</a>
    </footer>
  )
}

export default Popup
