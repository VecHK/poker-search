import React from 'react'
import { accessModeTipText } from '../../Options/components/SiteSettingsManager/AccessModeSetting'
import { ActionWrap, ActionLink } from '../ActionSwitch'

import './2-AccessMode.css'

export default function AccessModeFloor({ onClickBack }: { onClickBack: () => void }) {
  return (
    <article className="AccessModeFloor">
      <ActionWrap>
        <ActionLink onClick={onClickBack}>⬆ 返回</ActionLink>
      </ActionWrap>
      {accessModeTipText}
    </article>
  )
}
