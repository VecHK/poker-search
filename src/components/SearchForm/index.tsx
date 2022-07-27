import React, { useState } from 'react'
import s from './index.module.css'

import IconSubmitSrc from './submit.svg'
import IconSubmitClickedSrc from './submit-clicked.svg'

const SearchForm: React.FC<{
  only_mode: boolean
  keyword: string
  keywordPlaceholder?: string
  submitButtonActive: boolean
  setKeyword: React.Dispatch<React.SetStateAction<string>>
  onSubmit: (e: { keyword: string }) => void
}> = ({ only_mode, keyword, keywordPlaceholder, submitButtonActive, setKeyword, onSubmit }) => {
  const [focus, setFocus] = useState(false)
  const focusClass = focus ? s.Focus : ''

  return (
    <form
      className={`${s.SearchInputForm} ${focusClass}`}
      onSubmit={(e) => onSubmit(formDataTransform(e))}
    >
      <div className={`${s.OnlyMode} ${only_mode ? s.OnlyModeActive : ''}`}></div>

      <KeywordInput
        value={keyword}
        placeholder={keywordPlaceholder}
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
    throw Error(`formData 'keyword' value not found!`)
  } else if (typeof keyword !== 'string') {
    throw Error(`formData 'keyword' value is not a string!`)
  } else {
    return { keyword }
  }
}

const KeywordInput: React.FC<{
  value: string
  placeholder?: string
  setValue: React.Dispatch<React.SetStateAction<string>>
  onFocus: React.FocusEventHandler<HTMLInputElement>
  onBlur: React.FocusEventHandler<HTMLInputElement>
}> = ({ value, placeholder, setValue, onFocus, onBlur }) => {
  return (
    <input
      alt="input-keyword"
      name="keyword"
      placeholder={placeholder}
      className={s.Input}
      value={value}
      autoFocus
      onFocus={onFocus}
      onBlur={onBlur}
      onInput={e => {
        setValue(e.currentTarget.value)
      }}
    />
  )
}

const SubmitButton: React.FC<{ active: boolean }> = ({ active }) => {
  return (
    <button
      type="submit"
      className={s.IconSubmit}
    >
      <img
        alt="submit-keyword"
        src={active ? IconSubmitClickedSrc : IconSubmitSrc}
        className={s.IconSubmitImg}
      />
    </button>
  )
}
