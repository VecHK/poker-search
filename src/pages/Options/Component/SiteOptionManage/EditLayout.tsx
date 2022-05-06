import React, { useCallback, useMemo, useState } from 'react'
import { SiteOption } from '../../../../options/site-matrix'
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

function formDataTransform(sourceOption: SiteOption, e: React.FormEvent<HTMLFormElement>): SiteOption {
  e.preventDefault()

  const formData = new FormData(e.currentTarget)
  return {
    ...sourceOption,
    url_pattern: getFormItem(formData, 'url_pattern')
  }
}

function validUrlPattern(urlPattern: string): void | never {
  try {
    new URL(urlPattern)
  } catch (err) {
    throw Error('请输入一个合法的 URL')
  }
}

function valid(siteOption: SiteOption): true | Error {
  try {
    validUrlPattern(siteOption.url_pattern)
    return true
  } catch (err) {
    return err as Error
  }
}

type EditLayoutProps = {
  siteOption: SiteOption
  onSubmit(siteOption: SiteOption): void
  onCancel(): void
}
export default function EditLayout({ siteOption, onSubmit, onCancel }: EditLayoutProps) {
  const [failure, setFailure] = useState<Error | null>(null)
  const [urlPattern, setUrlPattern] = useState(siteOption.url_pattern)
  
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
        const newOption = formDataTransform(siteOption, e)

        const res = valid(newOption)
        if (res === true) {
          onSubmit(newOption)
        } else {
          setFailure(res)
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
      </div>
      <div className={s.ButtonGroup}>
        <button className={s.Button} type="submit">确定</button>
        <button className={s.Button} type="button" onClick={onCancel}>取消</button>
      </div>
      {failureNode}
    </form>
  )
}
