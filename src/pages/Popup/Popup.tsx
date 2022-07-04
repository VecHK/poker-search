import { Atomic } from 'vait'
import React, { useEffect, useState } from 'react'

import { controlIsLaunched } from '../../x-state/control-window-launched'
import { sendMessage } from '../../message'
import launchControlWindow from '../../Background/modules/launch'

import useCurrentWindow from '../../hooks/useCurrentWindow'
import useWindowFocus from '../../hooks/useWindowFocus'

import { validKeyword } from '../../utils/search'

import SearchForm from '../../components/SearchForm'
import './Popup.css'

const processing = Atomic()

export default PopupPage
function PopupPage () {
  return (
    <div className="App">
      <AppMain />
      <AppFooter />
    </div>
  )
}

function AppMain() {
  const [input, setInput] = useState('')
  const current_window_id = useCurrentWindow()?.windowId
  const windowIsFocus = useWindowFocus(true)

  useEffect(() => {
    controlIsLaunched()
      .then(isLaunched => {
        if (isLaunched) {
          sendMessage('Refocus', null).finally(() => {
            window.close()
          })
        }
      })
  }, [])

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
            if (current_window_id !== undefined) {
              processing(async () => {
                if (await controlIsLaunched()) {
                  console.log('send ChangeSearch message')
                  sendMessage('ChangeSearch', newSearchKeyword)
                    .then(() => {
                      window.close()
                    })
                    .catch(err => {
                      console.warn('send failure:', err)
                    })
                } else {
                  console.log('launchControlWindow')
                  launchControlWindow({
                    text: newSearchKeyword,
                    revert_container_id: current_window_id
                  })
                    .then(() => {
                      window.close()
                    }).catch(err => {
                      console.warn('launch failure:', err)
                    })
                }
              })
            }
          }
        }}
      />
    </main>
  )
}

async function getCurrentTabPageUrl() {
  const [ tab ] = await chrome.tabs.query({ active: true, currentWindow: true })

  if (tab === undefined) {
    throw Error('tab is undefined')
  }
  else if (tab.url === undefined) {
    throw Error('tab.url is undefined')
  }
  else {
    return tab.url
  }
}

const match_search_keyword = `poker`
function hasPokerSearchIdentifier(url: string) {
  const has_keyword_query = url.indexOf(encodeURIComponent(match_search_keyword)) !== -1
  const has_keyword_base64 = url.indexOf(btoa(match_search_keyword)) !== -1
  return has_keyword_query || has_keyword_base64
}

function AppFooter() {
  const [isPokerSearchIdentifier, setPokerSearchIdentifier] = useState(false)

  useEffect(() => {
    getCurrentTabPageUrl()
      .then(hasPokerSearchIdentifier)
      .then(setPokerSearchIdentifier)
  }, [])

  return (
    <footer className="App-footer">
      <a
        href={chrome.runtime.getURL('options.html')}
        target="_blank"
        rel="noreferrer"
      >打开 Poker 设置</a>

      { !isPokerSearchIdentifier ? null : (
        <a
          href={chrome.runtime.getURL('options.html')}
          target="_blank"
          rel="noreferrer"
        >
          添加该站点到 Poker
        </a>
      ) }
    </footer>
  )
}
