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
