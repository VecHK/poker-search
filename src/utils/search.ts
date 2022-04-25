import { createSearch } from "./layout"

const { id: chrome_id } = chrome.runtime

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

export async function openSearchWindows(keyword: string, canContinue: () => boolean, stop: () => void) {
  return createSearch(canContinue, stop, [
    { keyword, urlPattern: `https://mobile.twitter.com/search?q=[[]]&src=typeahead_click&${chrome_id}` },
    { keyword, urlPattern: `https://www.google.com/search?q=[[]]&${chrome_id}` },
    { keyword, urlPattern: `https://pache.blog/tag/[[]]?${chrome_id}` },
    { keyword, urlPattern: `https://www.vgtime.com/search/list.jhtml?${chrome_id}=2&keyword=[[]]` },
    { keyword, urlPattern: `https://www.zhihu.com/search?type=content&q=[[]]&${chrome_id}` },
    { keyword: randomString(16, 1), urlPattern: `http://localhost:2070/[[]]` },
    { keyword: randomString(16, 1), urlPattern: `http://localhost:2070/[[]]` },
    { keyword: randomString(16, 1), urlPattern: `http://localhost:2070/[[]]` },
    { keyword: randomString(16, 1), urlPattern: `http://localhost:2070/[[]]` },
    { keyword: randomString(16, 1), urlPattern: `http://localhost:2070/[[]]` },
    { keyword: randomString(16, 1), urlPattern: `http://localhost:2070/[[]]` },
    { keyword: randomString(16, 1), urlPattern: `http://localhost:2070/[[]]` },
    { keyword: randomString(16, 1), urlPattern: `http://localhost:2070/[[]]` },
    { keyword: randomString(16, 1), urlPattern: `http://localhost:2070/[[]]` },
    { keyword: randomString(16, 1), urlPattern: `http://localhost:2070/[[]]` },
    { keyword: randomString(16, 1), urlPattern: `http://localhost:2070/[[]]` },
    { keyword: randomString(16, 1), urlPattern: `http://localhost:2070/[[]]` },
    { keyword: randomString(16, 1), urlPattern: `http://localhost:2070/[[]]` },
    { keyword: randomString(16, 1), urlPattern: `http://localhost:2070/[[]]` },
    { keyword: randomString(16, 1), urlPattern: `http://localhost:2070/[[]]` },
    { keyword: randomString(16, 1), urlPattern: `http://localhost:2070/[[]]` },
    { keyword: randomString(16, 1), urlPattern: `http://localhost:2070/[[]]` },
    { keyword: randomString(16, 1), urlPattern: `http://localhost:2070/[[]]` },
    { keyword: randomString(16, 1), urlPattern: `http://localhost:2070/[[]]` },
    { keyword: randomString(16, 1), urlPattern: `http://localhost:2070/[[]]` },
    { keyword: randomString(16, 1), urlPattern: `http://localhost:2070/[[]]` },
  ])
}
