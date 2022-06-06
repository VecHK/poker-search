import React, { ReactNode } from 'react'

type ChromeLinkProps = {
  url: string
  children: ReactNode
}
export function ChromeLink({ url, children } : ChromeLinkProps) {
  function handleClick(
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) {
    e.preventDefault()
    console.log('e', e)
    // chrome.tabs.create({ url })
    chrome.windows.create({
      url,
      type: 'popup',

      width: 800,
      height: 1024,
    })
  }

  return (
    <a onClick={handleClick} href={url} target="_blank" rel="noreferrer" >{children}</a>
  )
}
