import React from 'react'
import s from './index.module.css'

import IconArrowSrc from './arrow.svg'

type Type = 'previus' | 'next'
const ArrowButton: React.FC<{ 
  type: Type
  onClick?: () => void
}> = ({ type, onClick }) => (
  <div className={s.IconArrow} onClick={onClick}>
    <img
      alt={`${type} page`}
      src={IconArrowSrc}
      className={`${s.IconArrowImg} ${s['type-' + type]}`}
    />
  </div>
)

const ArrowButtonGroup: React.FC<{
  onClick: (t: Type) => void
}> = ({ onClick }) => (
  <div className={s.Group}>
    <ArrowButton type="previus" onClick={() => onClick('previus')} />
    <ArrowButton type="next" onClick={() => onClick('next')} />
  </div>
)
export default ArrowButtonGroup
