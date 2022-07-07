import React, { ReactNode, useCallback, useMemo, useRef, useState } from 'react'
import { SiteOption } from '../../../../preferences/site-settings'
import { getFormItem } from '../../../../utils/form'

import AccessModeSetting from './AccessModeSetting'
import s from './EditLayout.module.css'

function getAccessMode(formData: FormData): SiteOption['access_mode'] {
  const val = formData.get('access_mode')

  if ((val === 'DESKTOP') || (val === 'MOBILE') ||  (val === 'MOBILE-STRONG')) {
    return val
  } else {
    throw Error(`formData 'access_mode' value is not SiteOption.access_mode type`)
  }
}

function formDataTransform(sourceOption: SiteOption, e: React.FormEvent<HTMLFormElement>): SiteOption {
  e.preventDefault()

  const formData = new FormData(e.currentTarget)

  return {
    ...sourceOption,
    url_pattern: getFormItem(formData, 'url_pattern'),
    access_mode: getAccessMode(formData),
  }
}

function validUrlPattern(urlPattern: string): void | never {
  try {
    new URL(urlPattern)
  } catch (err) {
    throw Error('请输入一个合法的 URL')
  }
}

function valid(siteOption: SiteOption): true {
  validUrlPattern(siteOption.url_pattern)
  return true
}

type EditLayoutProps = {
  siteOption: SiteOption
  onSubmit(siteOption: SiteOption): void
  onCancel(): void
  showForceMobileAccessTips?: boolean
}

export function RenderEditLayout({
  formRef,
  siteOption,
  onSubmit,
  onCancel,
  children: renderProp,
  showForceMobileAccessTips = true
}: EditLayoutProps & {
  formRef?: React.RefObject<HTMLFormElement>
  children: (p: {
    formFields: ReactNode,
    buttonGroup: ReactNode,
    failureNode: ReactNode,
  }) => ReactNode
}) {
  const [failure, setFailure] = useState<Error | null>(null)
  const [urlPattern, setUrlPattern] = useState(siteOption.url_pattern)
  const [accessMode, setAccessMode] = useState(siteOption.access_mode)

  const failureNode = useMemo(() => {
    if (failure) {
      return <div className={s.Failure}>{failure.message}</div>
    } else {
      return null
    }
  }, [failure])

  return (
    <form
      className={s.EditLayout}
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault()
        try {
          if (siteOption !== null) {
            const newOption = formDataTransform(siteOption, e)
            valid(newOption)
            if (newOption.url_pattern === siteOption.url_pattern) {
              onSubmit(newOption)
            } else {
              onSubmit({
                ...newOption,
                icon: null,
              })
            }
          }
        } catch (err) {
          console.error('submit error', err)
          setFailure(err as Error)
        }
      }}
    >
      { renderProp({
          formFields: (
            <div>
              <label>
                <span>URL</span>
                <input
                  className={s.UrlPatternInput}
                  value={ urlPattern }
                  onChange={(e) => setUrlPattern(e.target.value)}
                  name="url_pattern"
                />
              </label>
              <AccessModeSetting
                accessMode={accessMode}
                onChange={setAccessMode}
                showForceMobileAccessTips={showForceMobileAccessTips}
              />
            </div>
          ),
          buttonGroup: (
            <div className={s.ButtonGroup}>
              <button className={s.Button} type="submit">确定</button>
              <button className={s.Button} type="button" onClick={onCancel}>取消</button>
            </div>
          ),
          failureNode
      }) }
    </form>
  )
}

export default function EditLayout(props: EditLayoutProps) {
  return (
    <RenderEditLayout {...props}>{
      ({ formFields, buttonGroup, failureNode }) => (
        <>
          {formFields}
          {buttonGroup}
          {failureNode}
        </>
      )
    }</RenderEditLayout>
  )
}

export function useEditLayoutSubmit() {
  const formRef = useRef<HTMLFormElement>(null)

  const triggerSubmit = useCallback(() => {
    const formEl = formRef.current
    if (formEl !== null) {
      formEl.requestSubmit()
    }
  }, [])

  return [ formRef, triggerSubmit ] as const
}
