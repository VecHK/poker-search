import React, { useMemo, useState } from 'react'
import s from './index.module.css'

import IconSubmitSrc from './submit.svg'
import IconSubmitClickedSrc from './submit-clicked.svg'

const SearchForm: React.FC<{
  keyword: string
  submitButtonActive: boolean
  setKeyword: React.Dispatch<React.SetStateAction<string>>
  onSubmit: (e: { keyword: string }) => void
}> = ({ keyword, submitButtonActive, setKeyword, onSubmit }) => {
  const [focus, setFocus] = useState(false)
  const focusClass = focus ? s.Focus : ''

  return (
    <form
      className={`${s.SearchInputForm} ${focusClass}`}
      onSubmit={(e) => onSubmit(formDataTransform(e))}
    >
      <KeywordInput
        value={keyword}
        setValue={setKeyword}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
      />
      <SubmitButton active={submitButtonActive} />
    </form>
  )
}
export default SearchForm

const formDataTransform = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()

  const formData = new FormData(e.currentTarget)
  const keyword = formData.get('keyword')
  if (keyword === null) {
    throw new Error(`formData 'keyword' value not found!`)
  } else if (typeof keyword !== 'string') {
    throw new Error(`formData 'keyword' value is not a string!`)
  } else {
    return { keyword }
  }
}

const KeywordInput: React.FC<{
  value: string
  setValue: React.Dispatch<React.SetStateAction<string>>
  onFocus: React.FocusEventHandler<HTMLInputElement>
  onBlur: React.FocusEventHandler<HTMLInputElement>
}> = ({ value, setValue, onFocus, onBlur }) => useMemo(() => {
  return (
    <input
      alt="input-keyword"
      name="keyword"
      className={s.Input}
      value={value}
      onFocus={onFocus}
      onBlur={onBlur}
      onInput={e => {
        setValue(e.currentTarget.value)
      }}
    />
  )
}, [onBlur, onFocus, setValue, value])

const SubmitButton: React.FC<{ active: boolean }> = ({ active }) => {
  const imgNode = useMemo(() => {
    const src = active ? IconSubmitClickedSrc : IconSubmitSrc
    return (
      <img
        alt="submit-keyword"
        src={src}
        className={s.IconSubmitImg}
      />
    )
  }, [active])

  return (
    <button
      type="submit"
      className={s.IconSubmit}
    >
      {imgNode}
    </button>
  )
  }
