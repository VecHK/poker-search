import { last } from 'ramda'
import contentTypeParser from 'whatwg-mimetype'

export function appendPath(path: string, relative_path: string): string {
  if (last(path) === '/') {
    return `${path}${relative_path}`
  } else {
    return `${path}/${relative_path}`
  }
}

function appendRelativePath(base_url: string, path: string): string {
  const base = new URL(base_url)

  const new_path = appendPath(base.pathname, path)

  const u = new URL(`${base.origin}${new_path}`)
  return u.toString()
}

function toURL(src: string, base_url: string): string {
  const u = new URL(base_url)

  if (/^\/\//.test(src)) {
    return `${u.protocol}${src}`
  }
  else if (/^\//.test(src)) {
    return `${u.origin}${src}`
  }
  else if (/^\./.test(src)) {
    return appendRelativePath(base_url, src)
  }
  else {
    return src
  }
}

type Rule = { selector: string, iconSrcAttr: string }
const SEARCH_RULES: Rule[] = [
  { selector: 'link[rel="apple-touch-icon"]', iconSrcAttr: 'href' },
  { selector: 'link[rel="apple-touch-icon-precomposed"]', iconSrcAttr: 'href' },
  { selector: 'link[rel="icon"]', iconSrcAttr: 'href' },
  { selector: 'link[rel="shortcut icon"]', iconSrcAttr: 'href' },
]
function parseIconFromHTML(html: string, url: string): string | null {
  const dp = new DOMParser()
  const doc = dp.parseFromString(html, 'text/html')

  const $ = (s: string) => doc.querySelector(s)

  for (const rule of SEARCH_RULES) {
    const el = $(rule.selector)
    if (el) {
      const icon_src = el.getAttribute(rule.iconSrcAttr)
      if (icon_src) {
        return toURL(icon_src, url)
      }
    }
  }
  return null
}

async function getIconFromHTML(url: string): Promise<string | null> {
  const res = await fetch(url)
  if (res.status === 404) {
    return null
  } else {
    const blob = await res.blob()
    const html = await blob.text()
    return parseIconFromHTML(html, url)
  }
}

function contentTypeIsImage(res: Response): boolean {
  const raw_content_type = res.headers.get('content-type')
  if (raw_content_type === null) {
    throw Error('failure content type')
  } else {
    const ct = contentTypeParser.parse(raw_content_type)
    if (ct === null) {
      throw Error('content type parse failure')
    } else {
      return ct.type === 'image'
    } 
  }
}

async function getIconFromOrigin(origin: string): Promise<string | null> {
  const favicon_url = `${origin}/favicon.ico`
  const res = await fetch(favicon_url)
  if ((res.status !== 404) && contentTypeIsImage(res)) {
    return favicon_url
  } else {
    return null
  }
}

export default async function getIcon(url: string): Promise<string | null> {
  const { origin } = new URL(url)

  return (await getIconFromHTML(url)) ||
    (await getIconFromOrigin(origin)) ||
    null
}
