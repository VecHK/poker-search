import React, { useEffect, useMemo, useState } from 'react'
import CacheImage from '../../../../components/CacheImage'
import Loading from '../../../../components/Loading'
import cfg from '../../../../config'
import useMount from '../../../../hooks/useMount'
import { SiteOption, toSearchURL } from '../../../../preferences/site-settings'
import getIcon from '../../../../utils/get-icon'

import s from './SiteIcon.module.css'

export type SiteIconProp = {
  src: SiteOption['icon']
  urlPattern: string
  onIconUpdate(src: string): void
}
export default function SiteIcon({
  src,
  urlPattern,
  onIconUpdate
}: SiteIconProp) {
  const [isStartLoading, setStartLoading] = useState<boolean>(src !== null)
  const [nowUrlPattern, setNowUrlPattern] = useState<string>(urlPattern)
  const [loading, setLoading] = useState<boolean>(false)

  const getMount = useMount()

  useEffect(() => {
    // urlPattern 修改后再次加载图标
    if (nowUrlPattern !== urlPattern) {
      setStartLoading(false)
    }
  }, [nowUrlPattern, urlPattern])

  useEffect(() => {
    if (isStartLoading === false) {
      setStartLoading(true)
      setLoading(true)
      if (src === null) {
        setStartLoading(true)
        setNowUrlPattern(urlPattern)
        getIcon(toSearchURL(urlPattern, 'hello'))
          .then(newSrc => {
            if (getMount()) {
              if (newSrc === null) {
                setLoading(false)
              } else {
                setLoading(false)
                onIconUpdate(newSrc)
              }
            }
          })
          .catch(() => {
            if (getMount()) {
              setLoading(false)
            }
          })
      }
    }
  }, [getMount, isStartLoading, onIconUpdate, src, urlPattern])

  const innerNode = useMemo(() => {
    if (loading) {
      return <Loading />
    } if (isStartLoading === false) {
      return <Loading />
    } else if (src === null) {
      return <img alt="SiteIcon" style={{ width: '100%' }} src={cfg.DEFAULT_SITE_ICON} />
    } else {
      return <CacheImage alt="SiteIcon" style={{ width: '100%' }} src={src} />
    }
  }, [isStartLoading, loading, src])

  return (
    <div className={s.SiteIcon}>
      {innerNode}
    </div>
  )
}
