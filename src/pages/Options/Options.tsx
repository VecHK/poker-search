import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import pkg from '../../../package.json'
import { load, Options, save } from '../../options'
import { SiteMatrix } from '../../options/'

import SettingHeader from './Component/SettingHeader'
import SettingItem from './Component/SettingItem'
import SettingSwitch from './Component/SettingSwitch'
import SiteOptionManage from './Component/SiteOptionManage'
import Loading from '../../components/Loading'
import Failure from './Component/Failure'

import s from './Options.module.css'
import { findIndex, map, propEq, update } from 'ramda'

function calcMaxColumn(siteMatrix: SiteMatrix) {
  return siteMatrix.reduce((p, c) => Math.max(p, c.length), 0)
}

function useAdjustMarginCenter(siteMatrix: SiteMatrix) {
  const ref = useRef<HTMLDivElement>(null)
  const [, setMaxColumn] = useState(calcMaxColumn(siteMatrix))

  function adjust(ref: React.RefObject<HTMLDivElement>) {
    const el = ref.current
    if (el) {
      const innerWidth = el.offsetWidth
      if (innerWidth < window.innerWidth) {
        el.style['marginLeft'] = `calc((${window.innerWidth}px / 2) - (${innerWidth}px / 2))`
      } else {
        el.style['marginLeft'] = `0`
      }
    }
  }

  useEffect(() => {
    const el = ref.current

    if (el) {
      el.style['transition'] = 'margin-left 382ms'
    }

    setMaxColumn(latestColumn => {
      const newColumn = calcMaxColumn(siteMatrix)

      if (newColumn > latestColumn) {
        adjust(ref)
      } else {
        setTimeout(() => adjust(ref), 382)
      }

      return newColumn
    })
  }, [ref, siteMatrix])

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined = undefined
    const resizeHandler = () => {
      timer = setTimeout(() => adjust(ref), 300)
    }
    window.addEventListener('resize', resizeHandler)
    return () => {
      clearTimeout(timer as unknown as number)
      window.removeEventListener('resize', resizeHandler)
    }
  })

  return ref
}

export default function OptionsPage() {
  const [options, setOptions] = useState<Options>()
  const [failure, setFailure] = useState<Error>()

  const refresh = useCallback(() => {
    setFailure(undefined)
    load()
      .then(setOptions)
      .catch(setFailure)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (options !== undefined) {
      save(options)
    }
  }, [options])

  const innerEl = useAdjustMarginCenter(options ? options.site_matrix : [])

  return (
    <div className={s.OptionsContainer}>
      <div ref={innerEl} className={s.OptionsInner}>{
        useMemo(() => {
          if (failure) {
            return <Failure error={failure} />
          } else if (!options) {
            return <Loading />
          } else {
            return (
              <>
                <header className={s.OptionsHeader}>
                  <SettingHeader version={pkg.version} />
                </header>
                <div className={s.OptionsCols}>
                  <div className={s.OptionsCol} style={{ minWidth: '590px' }}>
                    <SettingItem>
                      <SettingSwitch
                        title="使用 Poker 关键字启动搜索"
                        description="在搜索栏中输入「Poker + 空格 + 想要搜索的内容」才使用发牌手"
                      />
                    </SettingItem>

                    <SettingItem title="使用方法介绍">
                      <p>使用方法介绍</p>
                      <p>使用方法介绍</p>
                      <p>使用方法介绍</p>
                    </SettingItem>

                    <SettingItem title="关于">
                      <p>
                        <a href="https://github.com/vechk/poker/">https://github.com/vechk/poker/</a>
                      </p>
                      <p>
                        <a href="https://github.com/vechk/poker/">https://github.com/vechk/poker/</a>
                      </p>
                      <p>
                        <a href="https://github.com/vechk/poker/">https://github.com/vechk/poker/</a>
                      </p>
                    </SettingItem>
                  </div>
                  <div className={s.OptionsCol}>
                    <SiteOptionManage
                      siteMatrix={options.site_matrix}
                      onUpdate={(updateId, newSiteOption) => {
                        setOptions(latestOptions => {
                          if (!latestOptions) {
                            return undefined
                          } else {
                            return {
                              ...latestOptions,
                              site_matrix: map(row => {
                                const find_idx = findIndex(propEq('id', updateId), row)
                                if (find_idx !== -1) {
                                  return update(find_idx, newSiteOption, row)
                                } else {
                                  return row
                                }
                              }, latestOptions.site_matrix)
                            }
                          }
                        })
                      }}
                      onChange={(newMatrix) => {
                        console.log('matrix change', newMatrix)
                        if (newMatrix.length === 0) {
                          alert('站点配置项无法留空')
                        } else {
                          setOptions({
                            ...options,
                            site_matrix: newMatrix
                          })
                        }
                      }}
                    />
                  </div>
                </div>
              </>
            )
          }
        }, [failure, options])
      }</div>
    </div>
  )
}
