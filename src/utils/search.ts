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

export function toPlainURL() {
  return chrome.runtime.getURL(`/plainWindow.html`)
}
