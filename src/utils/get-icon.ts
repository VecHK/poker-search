import { last } from 'ramda'

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
function getIconFromHTML(html: string, url: string): string | null {
  const el = document.createElement('html')
  el.innerHTML = html

  const $ = (s: string) => el.querySelector(s)

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

async function getIconFromOrigin(origin: string): Promise<string | null> {
  const favicon_url = `${origin}/favicon.ico`
  try {
    const res = await fetch(favicon_url)
    if (res.status !== 404) {
      return favicon_url
    } else {
      return null
    }
  } catch {
    return null
  }
}

function getIconByGoogle(url: string, size: number) {
  url = encodeURIComponent(url)
  return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=${size}&url=${url}`
}

const SITE_ICON_SIZE = 96
export default async function getIcon(url: string): Promise<string | null> {
  const res = await fetch(url)
  const blob = await res.blob()
  const html = await blob.text()

  const { origin } = new URL(url)

  return getIconFromHTML(html, url) ||
    (await getIconFromOrigin(origin)) ||
    getIconByGoogle(url, SITE_ICON_SIZE)
}
