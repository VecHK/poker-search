export function getSearchword() {
  const sp = new URLSearchParams(window.location.search)

  const word = sp.get('q')
  if (word) {
    return word
  } else {
    throw Error('word is empty!')
  }
}

export function toSearchURL(keyword: string, urlPattern: string) {
  return urlPattern.replace('[[]]', encodeURIComponent(keyword))
}

const trueOrFalse = () => Math.round(Math.random())
const backCode = () => 65 + Math.round(Math.random() * 25)
const randomChar = (lower = 0) => String.fromCharCode(backCode() + (lower && 32))
const randomString = (length: number, lower = 0): string => randomChar(lower && trueOrFalse()) + (--length ? randomString(length, lower) : '');
