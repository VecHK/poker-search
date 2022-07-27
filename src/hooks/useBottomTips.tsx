import React, { ReactNode, useEffect, useMemo, useState } from 'react'

export default function useBottomTips() {
  const [text, setText] = useState<ReactNode>(null)
  const [show_tips, setTips] = useState<number | false>(false)

  useEffect(() => {
    if (show_tips !== false) {
      const handler = setTimeout(() => {
        setTips(() => false)
      }, 3000)
      return () => clearTimeout(handler)
    }
  }, [show_tips])

  return [
    function showTips(text: ReactNode) {
      setText(text)
      setTips(Date.now())
    },

    useMemo(() => (
      <div className={`bottom-tips ${show_tips ? 'show' : ''}`}>
        <div className="bottom-tips-inner">{text}</div>
      </div>
    ), [show_tips, text])
  ] as const
}
