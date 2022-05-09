type Rule = { selector: string, iconSrcAttr: string }
const searchRules: Rule[] = [
  { selector: 'link[rel="apple-touch-icon"]', iconSrcAttr: 'href' },
  { selector: 'link[rel="apple-touch-icon-precomposed"]', iconSrcAttr: 'href' },
  { selector: 'link[rel="icon"]', iconSrcAttr: 'href' },
  { selector: 'link[rel="shortcut icon"]', iconSrcAttr: 'href' },
]

function appendRelativePath(base: string, append: string) {
  const [last_char] = [...base].reverse()
  if (last_char === '/') {
    return `${base}${append}`
  } else {
    return `${base}/${append}`
  }
}

function appendRelativeURL(base_url: string, relative_url: string): string {
  const b = new URL(base_url)
  const b_path = b.pathname

  const r = new URL(relative_url)
  const r_path = r.pathname

  const new_path = appendRelativePath(b_path, r_path)

  return `${b.origin}${new_path}`
}

function toAbsoluteURL(src: string, url: string): string {
  const u = new URL(url)

  if (/^\/\//.test(src)) {
    return `${u.protocol}${src}`
  } else if (/^\//.test(src)) {
    return `${u.origin}${src}`
  } else if (/^\./.test(src)) {
    return appendRelativeURL(url, src)
  } else {
    return src
  }
}

function getIconFromHTML(html: string, url: string): string | null {
  const el = document.createElement('html')
  el.innerHTML = html

  const $ = (s: string) => el.querySelector(s)

  for (const rule of searchRules) {
    const el = $(rule.selector)
    if (el) {
      const icon_src = el.getAttribute(rule.iconSrcAttr)
      if (icon_src) {
        return toAbsoluteURL(icon_src, url)
      } else {
        return null
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

export default async function getIcon(url: string): Promise<string | null> {
  const res = await fetch(url)
  const blob = await res.blob()
  const html = await blob.text()

  const { origin } = new URL(url)

  return getIconFromHTML(html, url) || (await getIconFromOrigin(origin)) || getIconByGoogle(url, 96)
}
