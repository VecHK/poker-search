import React, { useEffect, useState } from 'react'

import { Base64 } from 'js-base64'

import cfg from '../../../config'

import { RenderEditLayout, useEditLayoutSubmit } from '../../Options/components/SiteSettingsManager/EditLayout'
import { generateExampleOption } from '../../../preferences/default'
import { SiteOption } from '../../../preferences'
import ActionSwitch, { SwitchState } from '../ActionSwitch'

import './1-AddToPoker.css'

export default function AddToPoker({
  switchState,
  onSave,
  onClickCancel,
  onClickAddToPoker,
  onClickForceMobileAccessTipsCircle,
}: {
  switchState: SwitchState
  onSave: (s: SiteOption) => void
  onClickCancel: () => void
  onClickAddToPoker: () => void
  onClickForceMobileAccessTipsCircle: () => void
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
    <div className="AddToPoker">
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
            onClickForceMobileAccessTipsCircle={onClickForceMobileAccessTipsCircle}
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
    </div>
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

const match_search_keyword_list = [`poker`, `Poker`, `POKER`]
function hasPokerSearchIdentifier(url: string) {
  return match_search_keyword_list.some((match_search_keyword) => {
    const has_keyword_query = url.indexOf(encodeURIComponent(match_search_keyword)) !== -1
    const has_keyword_base64 = url.indexOf(encodeURIComponent(Base64.encode(match_search_keyword))) !== -1
    return has_keyword_query || has_keyword_base64
  })
}

function replaceAsUrlPattern(url: string): string {
  return match_search_keyword_list.reduce((url, match_search_keyword) => (
    url
      .replaceAll(encodeURIComponent(match_search_keyword), cfg.KEYWORD_REPLACEHOLDER)
      .replaceAll(encodeURIComponent(Base64.encode(match_search_keyword)), cfg.KEYWORD_REPLACEHOLDER_WITH_BASE64)
  ), url)
}
