import { Memo } from 'vait'
import { sendMessage } from '../message'

function devLog(message?: any, ...optionalParams: any[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, ...optionalParams)
  }
}

devLog('Poker Content Script works!')

function insertAfter(existingNode: Element, newNode: Element) {
  existingNode.parentNode?.insertBefore(newNode, existingNode.nextSibling)
}

function insertBefore(currentNode: Element, newNode: Element) {
  currentNode.parentNode?.insertBefore(newNode, currentNode)
}

const $ = (s: string) => document.querySelector(s)

function createTryNode(getSearchText: () => string, style: React.CSSProperties = {}) {
  const node = document.createElement('div')
  node.style.position = 'relative'
  Object.assign(node.style, style)
  node.className = 'ext-try-poker'
  node.innerHTML = `找不到想要的结果？试试 <a style="cursor: pointer">Poker</a>`

  const a = node.querySelector('a')
  if (a) {
    a.style.color = '#0040ab'
    a.onclick = async (e) => {
      e.preventDefault()
      devLog('try clicked')

      sendMessage('TryPoker', getSearchText())
        .then(() => {
          devLog('send success: TryPoker')
        })
        .catch(err => {
          console.error('TryPoker failure:', err)
        })
    }
  }
  return node
}

function InitInject({ name, cond, exec }: {
  name: string
  cond: () => boolean,
  exec: () => Promise<void>
}) {
  return [name, cond, exec] as const
}

const Series = [
  InitInject({
    name: 'Google',
    cond() {
      const u = new URL(window.location.href)
      const is_google_hostname = u.hostname === 'www.google.com' || u.hostname === 'google.com'
      const is_search_page = u.pathname === "/search"

      const extabar_exists = Boolean( $('#extabar') )
      const botstuff_exists = Boolean( $('#botstuff') )

      return is_google_hostname && is_search_page && extabar_exists && botstuff_exists
    },
    async exec() {
      const extabar = $('#extabar')
      const botstuff = $('#botstuff')

      if (!extabar || !botstuff) {
        return
      } else {
        const getSearchText = () => {
          const input = document.querySelector<HTMLInputElement>('#searchform input')
          if (input === null) {
            throw Error('input is null')
          } else {
            return input.value
          }
        }
        extabar.parentNode?.appendChild(createTryNode(getSearchText, { color: '#70757a' }));
        (extabar as unknown as any).style.height = '32px'

        botstuff.appendChild(createTryNode(getSearchText, { color: '#70757a' }))
      }
    }
  }),

  InitInject({
    name: 'Baidu',
    cond() {
      const u = new URL(window.location.href)
      const is_baidu_hostname = u.hostname === 'www.baidu.com' || u.hostname === 'baidu.com'
      const is_search_page = u.pathname === "/s"
      const result_molecule_search_tool = Boolean( $('.result-molecule[tpl="app/search-tool"]') )
      const result_molecule_page = Boolean( $('.result-molecule[tpl="app/page"]') )

      return is_baidu_hostname && is_search_page && result_molecule_search_tool && result_molecule_page
    },
    async exec() {
      const result_molecule_search_tool = $('.result-molecule[tpl="app/search-tool"]')
      const result_molecule_page = $('.result-molecule[tpl="app/page"]')

      if (!result_molecule_search_tool || !result_molecule_page) {
        return
      } else {
        const getSearchText = () => {
          const input = document.querySelector<HTMLInputElement>('input#kw')
          if (input === null) {
            throw Error('input is null')
          } else {
            return input.value
          }
        }
        insertAfter(result_molecule_search_tool, createTryNode(getSearchText, { color: '#9195a3' }))
        insertBefore(result_molecule_page, createTryNode(getSearchText, { color: '#9195a3', paddingLeft: '150px' }))
      }
    }
  }),

  InitInject({
    name: 'Yahoo',
    cond() {
      const u = new URL(window.location.href)
      const is_yahoo_hostname = u.hostname === 'search.yahoo.com'
      const is_search_page = /^\/search;/.test(u.pathname)

      const search_super_top = Boolean( $('.searchSuperTop') )
      const search_bottom = Boolean( $('.searchBottom') )

      return is_yahoo_hostname && is_search_page && search_super_top && search_bottom
    },
    async exec() {
      const search_super_top = $('.searchSuperTop')
      const search_bottom = $('.searchBottom')

      if (!search_super_top || !search_bottom) {
        return
      } else {
        const getSearchText = () => {
          const input = document.querySelector<HTMLInputElement>('#sbq-wrap input')
          if (input === null) {
            throw Error('input is null')
          } else {
            return input.value
          }
        }
        insertAfter(search_super_top, createTryNode(
          getSearchText, { color: '#70757a', paddingBottom: '16px', paddingLeft: '20px' })
        )
        insertBefore(search_bottom, createTryNode(
          getSearchText, { color: '#70757a', paddingTop: '32px' })
        )
      }
    }
  }),

  InitInject({
    name: 'Yandex',
    cond() {
      const u = new URL(window.location.href)
      const is_yandex_hostname = u.hostname === 'yandex.com'
      const is_search_page = /^\/search/.test(u.pathname)

      const search_result_list = Boolean( $('#search-result.serp-list') )

      return is_yandex_hostname && is_search_page && search_result_list
    },
    async exec() {
      const search_result_list = $('#search-result.serp-list')

      if (!search_result_list) {
        return
      } else {
        const getSearchText = () => {
          const input = document.querySelector<HTMLInputElement>('.input__box input')
          if (input === null) {
            throw Error('input is null')
          } else {
            return input.value
          }
        }
        insertAfter(search_result_list, createTryNode(
          getSearchText, { color: 'rgba(62,70,94,.8)', paddingBottom: '16px', paddingLeft: '20px' })
        )
        insertBefore(search_result_list, createTryNode(
          getSearchText, { color: 'rgba(62,70,94,.8)', paddingBottom: '16px' })
        )
      }
    }
  }),

  InitInject({
    name: 'Duckduckgo',
    cond() {
      const u = new URL(window.location.href)
      const is_duckduckgo_hostname = u.hostname === 'duckduckgo.com'
      const is_search_query = Boolean( (new URLSearchParams(u.search)).get('q') )

      const search_filters_wrap = Boolean( $('.search-filters-wrap') )
      const links = Boolean( $('#links') )

      return is_duckduckgo_hostname && is_search_query && search_filters_wrap && links
    },
    async exec() {
      const search_filters_wrap = $('.search-filters-wrap')
      const links = $('#links')

      if (!search_filters_wrap || !links) {
        return
      } else {
        const getSearchText = () => {
          const input = document.querySelector<HTMLInputElement>('#search_form input[type="text"]')
          if (input === null) {
            throw Error('input is null')
          } else {
            return input.value
          }
        }
        insertAfter(search_filters_wrap, createTryNode(
          getSearchText, { color: 'rgba(62,70,94,.8)', paddingBottom: '16px', paddingLeft: '20px' })
        )
        insertAfter(links, createTryNode(
          getSearchText, { color: 'rgba(62,70,94,.8)', paddingBottom: '16px' })
        )
      }
    }
  }),

  InitInject({
    name: 'Bing',
    cond() {
      const u = new URL(window.location.href)
      const is_bing_hostname = /^((bing.com)|(cn.bing.com))/.test(u.hostname)
      const is_search_page = /^\/search/.test(u.pathname)

      const b_result = Boolean( $('#b_results') )
      const pagenation = Boolean( $('.b_pag') )

      return is_bing_hostname && is_search_page && b_result && pagenation
    },
    async exec() {
      const b_result = $('#b_results')
      const pagenation = $('.b_pag')

      if (!b_result || !pagenation) {
        return
      } else {
        const getSearchText = () => {
          const input = document.querySelector<HTMLInputElement>('input.b_searchbox')
          if (input === null) {
            throw Error('input is null')
          } else {
            return input.value
          }
        }
        insertBefore(pagenation, createTryNode(
          getSearchText, { color: 'rgba(62,70,94,.8)', paddingLeft: '20px' })
        )

        insertBefore(b_result, createTryNode(
          getSearchText, { color: 'rgba(62,70,94,.8)', paddingBottom: '8px', paddingLeft: '20px', paddingTop: '8px' })
        )
      }
    }
  })
] as const

function run() {
  for (const [name, cond, exec] of Series) {
    if (cond()) {
      devLog(`poker content: is ${name}`)
      try {
        exec()
      } finally {
        return true
      }
    }
  }
}

startDecting()
function startDecting() {
  const [ isExecuted, setExecute ] = Memo(false)

  function intervalDetecting() {
    const interval_handler = setInterval(() => {
      if (!isExecuted()) {
        if (run()) {
          setExecute(true)
          clean()
        }
      }
    }, 1000)

    function clean() {
      clearInterval(interval_handler)
    }

    return clean
  }

  if (run()) {
    setExecute(true)
    return
  } else {
    let cleanIntervalDetecting = intervalDetecting();

    // 没有去调查为什么 navigation 对象不存在
    // 不知道是不是 chrome 的专有接口
    ((window as any).navigation).addEventListener('navigate', () => {
      if (!isExecuted()) {
        cleanIntervalDetecting()
        cleanIntervalDetecting = intervalDetecting()
      }
    })
  }
}
