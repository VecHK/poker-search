export function getSearchword() {
  const sp = new URLSearchParams(window.location.search)

  const word = sp.get('q')
  if (word) {
    return word
  } else {
    throw Error('word is empty!')
  }
}
