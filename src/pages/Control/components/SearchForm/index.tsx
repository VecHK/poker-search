import React, { useCallback, useMemo } from 'react'
import s from './index.module.css'

import IconSubmit from './submit.svg'

const SearchForm: React.FC<{
  keyword: string
  setKeyword: React.Dispatch<React.SetStateAction<string>>
  onSubmit: (e: { keyword: string }) => void
}> = ({ keyword, setKeyword, onSubmit }) => {
  return (
    <form
      className={s.SearchInputFrame}
      onSubmit={(e) => {
        onSubmit(formDataTransform(e))
      }}
    >
      <KeywordInput value={keyword} setValue={setKeyword} />
      <SubmitButton />
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
}> = ({ value, setValue }) => useMemo(() => {
  return (
    <input
      alt="input-keyword"
      name="keyword"
      className={s.Input}
      value={value}
      onInput={e => {
        setValue(e.currentTarget.value)
      }}
    />
  )
}, [value, setValue])

const SubmitButton: React.FC = () => useMemo(() => {
  return (
    <button
      type="submit"
      className={s.IconSubmit}
    >
      <img
        alt="submit-keyword"
        src={IconSubmit}
        className={s.IconSubmitImg}
      />
    </button>
  )
}, [])
