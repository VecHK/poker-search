import { sendMessage } from '../message'

function devLog(message?: any, ...optionalParams: any[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, ...optionalParams)
  }
}

devLog('Poker Content Script works!')

const $ = (s: string) => document.querySelector(s)

function createTryNode(getSearchText: () => string, color = '#70757a') {
  const node = document.createElement('div')
  node.style.position = 'relative'
  node.style.color = color
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
  })
] as const

for (const [name, cond, exec] of Series) {
  if (cond()) {
    devLog(`poker content: is ${name}`)
    exec()
    break
  }
}
