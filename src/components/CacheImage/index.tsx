import React, { useMemo, useRef, useState } from 'react'
import { nextTick } from 'vait'

type ImageData = Readonly<[string, Blob]>
const _image_data_ = new Map<string, ImageData>()

async function imageElementToBlob(img: HTMLImageElement): Promise<ImageData | null> {
  const c = document.createElement('canvas')
  c.height = img.offsetHeight * window.devicePixelRatio
  c.width = img.offsetWidth * window.devicePixelRatio
  await nextTick()
  return new Promise((res) => {
    const ctx = c.getContext('2d')
    if (ctx) {
      ctx.drawImage(img, 0, 0, c.width, c.height)
      c.toBlob(b => {
        if (b) {
          res([URL.createObjectURL(b), b])
        } else {
          res(null)
        }
      })
    } else {
      res(null)
    }
  })
}

function getUrl(src: string): string | undefined {
  const d = _image_data_.get(src || '')
  if (d) {
    const [url] = d
    return url
  } else {
    return undefined
  }
}

export default function CacheImage(
  props: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>
  ) {
  let { src } = props
  const [cached_src, setCachedSrc] = useState<undefined | string>(
    getUrl(src || '')
  )
  const ref = useRef<HTMLImageElement>(null)

  return useMemo(() => (
    // eslint-disable-next-line
    <img
      ref={ref}
      {...props}
      src={cached_src ? cached_src : src}
      crossOrigin='anonymous'
      onLoad={async (e) => {
        if (cached_src) {
          return
        }

        if (src && src.length) {
          if (!_image_data_.get(src)) {
            const img = e.currentTarget
            try {
              const data = await imageElementToBlob(img)
              if (data) {
                _image_data_.set(src, data)
                const [cached_src] = data
                setCachedSrc(cached_src)
              }
            } catch (err) {
              console.log('load failure:', props.src, err)
            }
          }
        }
      }}
    />
  ), [cached_src, props, src])
}
