import React from 'react'
import s from './index.module.css'

function Key({ ch }: { ch: string }) {
  return (
    <span className={s.Key}>{ch}</span>
  )
}

export default function ShortcutsKey(props: { keys: string[] }) {
  return (
    <>
      {props.keys.map((ch, idx) => {
        const split = idx === 0 ? null : ' + '
        return (
          <React.Fragment key={idx}>
            {split}<Key ch={ch} />
          </React.Fragment>
        )
      })}
    </>
  )
}
