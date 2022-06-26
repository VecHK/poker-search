import React, { useMemo, useState } from 'react'
import { SiteOption } from '../../../../preferences/site-settings'
import Switch from '../Switch'
import s from './EditLayout.module.css'

function getFormItem(formData: FormData, name: string) {
  const value = formData.get(name)
  if (value === null) {
    throw Error(`formData '${name}' value not found!`)
  } else if (typeof value !== 'string') {
    throw Error(`formData '${name}' value is not a string!`)
  } else {
    return value
  }
}

function getFormCheckItem(formData: FormData, name: string): boolean {
  const value = formData.get(name)
  if ((value === null) || (typeof value === 'string')) {
    return value === 'on'
  } else {
    throw Error(`formData '${name}' value is not a string or null!`)
  }
}

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
}
export default function EditLayout({ siteOption, onSubmit, onCancel }: EditLayoutProps) {
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
        />
      </div>
      <div className={s.ButtonGroup}>
        <button className={s.Button} type="submit">确定</button>
        <button className={s.Button} type="button" onClick={onCancel}>取消</button>
      </div>
      {failureNode}
    </form>
  )
}

function AccessModeSetting({
  accessMode,
  onChange
}: {
  accessMode: SiteOption['access_mode']
  onChange: (a: SiteOption['access_mode']) => void
}) {
  const isDesktopAccess = accessMode === 'DESKTOP'
  const isStrongMobileAccess = accessMode === 'MOBILE-STRONG'

  return (
    <div className={s.AccessMode}>
      <input
        name="access_mode"
        readOnly
        value={accessMode}
        style={{ display: 'none' }}
      />
      <span>使用电脑端访问</span>
      <Switch
        name=""
        value={isDesktopAccess}
        onChange={(val) => {
          if (val === true) {
            onChange('DESKTOP')
          } else {
            onChange('MOBILE')
          }
        }}
      />

      {
        isDesktopAccess ? null : (
          <div style={{ marginLeft: '10px' }}>
            <span>强制使用移动端方式打开</span>
            <Switch
              name=""
              value={isStrongMobileAccess}
              onChange={(val) => {
                if (val === true) {
                  onChange('MOBILE-STRONG')
                } else {
                  onChange('MOBILE')
                }
              }}
            />
          </div>
        )
      }
    </div>
  )
}
