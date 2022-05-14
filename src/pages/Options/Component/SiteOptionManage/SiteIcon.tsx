import React, { useEffect, useMemo, useState } from 'react'
import Loading from '../../../../components/Loading'
import cfg from '../../../../config'
import { SiteOption, toSearchURL } from '../../../../options/site-matrix'
import getIcon from '../../../../utils/get-icon'

import s from './SiteIcon.module.css'

export type SiteIconProp = {
  src: SiteOption['icon']
  urlPattern: string
  onNewIconSrc(src: string): void
}
export default function SiteIcon({
  src,
  urlPattern,
  onNewIconSrc
}: SiteIconProp) {
  const [isStartLoading, setStartLoading] = useState<boolean>(src !== null)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    if (isStartLoading === false) {
      setStartLoading(true)
      setLoading(true)
      if (src === null) {
        setStartLoading(true)
        getIcon(toSearchURL(urlPattern, 'hello'))
          .then(newSrc => {
            if (newSrc === null) {
              setLoading(false)
            } else {
              setLoading(false)
              onNewIconSrc(newSrc)
            }
          })
          .catch(() => {
            setLoading(false)
          })
      }
    }
  }, [isStartLoading, loading, onNewIconSrc, src, urlPattern])

  const innerNode = useMemo(() => {
    if (loading) {
      return <Loading />
    } if (isStartLoading === false) {
      return <Loading />
    } else if (src === null) {
      return <img alt="SiteIcon" style={{ width: '100%' }} src={cfg.DEFAULT_SITE_ICON} />
    } else {
      return <img alt="SiteIcon" style={{ width: '100%' }} src={src} />
    }
  }, [isStartLoading, loading, src])

  return (
    <div className={s.SiteIcon}>
      {innerNode}
    </div>
  )
}
