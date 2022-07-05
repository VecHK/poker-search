import { Atomic } from 'vait'
import { reverse } from 'ramda'
import React, { useEffect, useState } from 'react'

import { controlIsLaunched } from '../../x-state/control-window-launched'
import { sendMessage } from '../../message'
import launchControlWindow from '../../Background/modules/launch'

import { validKeyword } from '../../utils/search'

import { AlarmSetTimeout } from '../../utils/chrome-alarms'
import { getCurrentDisplayLimit, Limit } from '../../core/base/limit'

import { RenderEditLayout, useEditLayoutSubmit } from '../Options/Component/SiteSettingsManager/EditLayout'
import { generateExampleOption } from '../../preferences/default'
import { load as loadPreferences, SiteSettings, SiteOption } from '../../preferences'
import { generateSiteSettingsRow } from '../../preferences/site-settings'

import useCurrentWindow from '../../hooks/useCurrentWindow'
import useWindowFocus from '../../hooks/useWindowFocus'
import usePreferences from '../Options/hooks/usePreferences'
import useMaxWindowPerLine from '../../hooks/useMaxWindowPerLine'

import SearchForm from '../../components/SearchForm'
import './Popup.css'

function PreventDefaultClick<E extends { preventDefault(): void }>(
  fn: (e: E) => void
) {
  return (
    function onClick(e: E) {
      e.preventDefault()
      return fn(e)
    }
  )
}

const processing = Atomic()

export default PopupPage
function PopupPage () {
  const [ switchState, setSwitchState ] = useState<SwitchState>('NORMAL')

  const { preferences, setPreferences, setPreferencesItem } = usePreferences({
    autoSave: true,
  })
  const [limit, setLimit] = useState<Limit>()

  const maxWindowPerLine = useMaxWindowPerLine(limit)

  useEffect(() => {
    getCurrentDisplayLimit()
      .then(setLimit)
  }, [])

  useEffect(() => {
    loadPreferences()
      .then(setPreferences)
  }, [setPreferences])

  useEffect(() => {
    if (switchState === 'SAVED') {
      const cancel = AlarmSetTimeout(1500, () => {
        setSwitchState('NORMAL')
      })

      return () => { cancel() }
    }
  }, [switchState])

  return (
    <div className="Popup">
      <PopupMain isOpenBackground={switchState === 'BACKGROUND'} />
      <PopupBackground
        switchState={switchState}
        onClickAddToPoker={() => {
          setSwitchState('BACKGROUND')
        }}
        onSave={(opt) => {
          console.log('onSave', preferences)
          if (preferences) {
            setPreferencesItem('site_settings')((latest) => {
              setSwitchState('SAVED')
              return addToSiteSettings(opt, latest.site_settings, maxWindowPerLine)
            })
          }
        }}
        onClickCancel={() => setSwitchState('NORMAL')}
      />
    </div>
  )
}

function PopupMain({ isOpenBackground }: { isOpenBackground: boolean }) {
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
    <main className={`popup-main ${isOpenBackground ? 'hide' : ''}`}>
      <div className="search-form-wrap">
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
      </div>
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

type Action = 'add-to-poker' | 'save' | 'cancel'
type SwitchState = 'NORMAL' | 'BACKGROUND' | 'SAVED'
function ActionSwitch({
  state,
  isPokerSearchIdentifier,
  actions
}: {
  state: SwitchState
  isPokerSearchIdentifier: boolean
  actions: { [k in Action]: () => void }
}) {
  function onAction(act: Action) {
    actions[act]()
  }

  const isNormal = state === 'NORMAL'
  const isOpenBackground = state === 'BACKGROUND'
  const isSaved = state === 'SAVED'

  return (
    <div className="action-switch">
      <div className={`action-normal ${isNormal ? '' : 'hide'}`}>
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
            onClick={PreventDefaultClick(() => {
              onAction('add-to-poker')
            })}
          >
            添加该站点到 Poker
          </a>
        ) }
      </div>
      <div className={`action-background ${isOpenBackground ? '' : 'hide'}`}>
        <a
          href={chrome.runtime.getURL('options.html')}
          target="_blank"
          rel="noreferrer"
          onClick={PreventDefaultClick(() => {
            onAction('save')
          })}
        >保存</a>

        <a
          href={chrome.runtime.getURL('options.html')}
          target="_blank"
          rel="noreferrer"
          onClick={PreventDefaultClick(() => {
            onAction('cancel')
          })}
        >取消</a>
      </div>

      <div className={`action-background ${isSaved ? '' : 'hide'}`}>
        <a
          href={chrome.runtime.getURL('options.html')}
          target="_blank"
          rel="noreferrer"
          onClick={PreventDefaultClick(() => {})}
        >已保存</a>
      </div>
    </div>
  )
}

function replaceAsUrlPattern(url: string) {
  return url
    .replaceAll(encodeURIComponent(match_search_keyword), '%poker%')
    .replaceAll(btoa(match_search_keyword), '%poker%')
}

function addToSiteSettings(
  new_site_option: SiteOption,
  site_settings: SiteSettings,
  maxWindowPerLine: number
): SiteSettings {
  if (site_settings.length === 0) {
    throw Error('site_settings.length is 0')
  } else {
    const [ first_settings, ...remain_settings ] = reverse(site_settings)
    const total_column = first_settings.row.length
    if (total_column >= maxWindowPerLine) {
      // 已满，另开新行
      return reverse([
        generateSiteSettingsRow([ new_site_option ]),
        first_settings,
        ...remain_settings
      ])
    } else {
      return reverse([
        {
          ...first_settings,
          row: [new_site_option, ...first_settings.row]
        },
        ...remain_settings
      ])
    }
  }
}

function PopupBackground({
  switchState,
  onSave,
  onClickCancel,
  onClickAddToPoker,
}: {
  switchState: SwitchState
  onSave: (s: SiteOption) => void
  onClickCancel: () => void
  onClickAddToPoker: () => void
}) {
  const [siteOption, setSiteOption] = useState<SiteOption | null>(null)
  const [url, setUrl] = useState<string | null>(null)

  const isPokerSearchIdentifier = url ? hasPokerSearchIdentifier(url) : false

  useEffect(() => {
    getCurrentTabPageUrl()
      .then(setUrl)
  }, [])

  useEffect(() => {
    if (switchState === 'BACKGROUND') {
      if (typeof url === 'string') {
        setSiteOption({
          ...generateExampleOption(),
          url_pattern: replaceAsUrlPattern(url),
        })
      }
    }
  }, [switchState, url])

  const [formRef, triggerSubmit] = useEditLayoutSubmit()

  return (
    <footer className="popup-background">
      <ActionSwitch
        state={switchState}
        isPokerSearchIdentifier={isPokerSearchIdentifier}
        actions={{
          'add-to-poker': onClickAddToPoker,
          'cancel': onClickCancel,
          'save': triggerSubmit,
        }}
      />

      <div className="option-edit-wrap">
        {!siteOption ? null : (
          <RenderEditLayout
            formRef={formRef}
            key={siteOption.id}
            siteOption={siteOption}
            onSubmit={(opt) => {
              console.log('onSubmit', opt)
              onSave({
                ...opt,
                icon: null
              })
            }}
            onCancel={() => {}}
          >
            {({ formFields, failureNode }) => (
              <>
                {failureNode}
                {formFields}
              </>
            )}
          </RenderEditLayout>
        )}
      </div>
    </footer>
  )
}
