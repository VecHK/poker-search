import React from 'react'
import s from './index.module.css'

export default function Key({ ch }: { ch: string }) {
  return (
    <span className={s.Key}>{ch}</span>
  )
}
