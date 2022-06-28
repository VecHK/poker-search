import { sendMessage } from '../message'

function devLog(message?: any, ...optionalParams: any[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, ...optionalParams)
  }
}

devLog('Poker Content Script works!')

// type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

function insertAfter(newNode: Element, existingNode: Element) {
  existingNode.parentNode?.insertBefore(newNode, existingNode.nextSibling)
}

function insertBefore(newNode: Element, currentNode: Element) {
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
        extabar.parentNode?.appendChild(createTryNode(getSearchText));
        (extabar as unknown as any).style.height = '32px'

        botstuff.appendChild(createTryNode(getSearchText))
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
        insertAfter(createTryNode(getSearchText, { color: '#9195a3' }), result_molecule_search_tool)
        insertBefore(createTryNode(getSearchText, { color: '#9195a3', paddingLeft: '150px' }), result_molecule_page)
      }
    }
  })
] as const

for (const [name, cond, exec] of Series) {
  if (cond()) {
    devLog(`poker content: is ${name}`)
    exec()
    break
  }
}
