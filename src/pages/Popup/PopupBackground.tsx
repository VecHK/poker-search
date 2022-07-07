import React, { useEffect, useState } from 'react'

import { RenderEditLayout, useEditLayoutSubmit } from '../Options/Component/SiteSettingsManager/EditLayout'
import { generateExampleOption } from '../../preferences/default'
import { SiteOption } from '../../preferences'
import ActionSwitch, { SwitchState } from './ActionSwitch'

import './PopupBackground.css'

export default function PopupBackground({
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
            showForceMobileAccessTips={false}
            onClickForceMobileAccessTipsCircle={() => {
              alert('click')
            }}
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

function replaceAsUrlPattern(url: string) {
  return url
    .replaceAll(encodeURIComponent(match_search_keyword), '%poker%')
    .replaceAll(btoa(match_search_keyword), '%poker%')
}
