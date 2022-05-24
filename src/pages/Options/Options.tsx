import pkg from '../../../package.json'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { curry, findIndex, map, propEq, update } from 'ramda'

import { load as loadPreferences, Preferences, save } from '../../preferences'
import { SiteSettings, toMatrix } from '../../preferences/site-settings'
import { getCurrentDisplayLimit, Limit } from '../../core/base/limit'

import SettingHeader from './Component/SettingHeader'
import SettingItem from './Component/SettingItem'
import SiteSettingsManager from './Component/SiteSettingsManager'
import Loading from '../../components/Loading'
import Failure from './Component/Failure'
import ImportExport from './Component/SiteSettingsManager/ImportExport'

import s from './Options.module.css'

function calcMaxColumn(siteSettings: SiteSettings) {
  return toMatrix(siteSettings).reduce((p, c) => Math.max(p, c.length), 0)
}

function useAdjustMarginCenter(siteSettings: SiteSettings, enable: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [, setMaxColumn] = useState(calcMaxColumn(siteSettings))

  const adjust = useCallback((ref: React.RefObject<HTMLDivElement>) => {
    if (enable) {
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
  }, [enable])

  useEffect(() => {
    const el = ref.current

    if (el) {
      el.style['transition'] = 'margin-left 382ms'
    }

    setMaxColumn(latestColumn => {
      const newColumn = calcMaxColumn(siteSettings)

      if (newColumn > latestColumn) {
        adjust(ref)
      } else {
        setTimeout(() => adjust(ref), 382)
      }

      return newColumn
    })
  }, [adjust, siteSettings])

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
  const [preferences, setPreferences] = useState<Preferences>()
  const [limit, setLimit] = useState<Limit>()
  const [failure, setFailure] = useState<Error>()

  const refresh = useCallback(() => {
    setFailure(undefined)
    Promise.all([loadPreferences(), getCurrentDisplayLimit()])
    .then(([preferences, limit]) => {
      setPreferences(preferences)
      setLimit(limit)
    })
    loadPreferences()
      .then(setPreferences)
      .catch(setFailure)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (preferences !== undefined) {
      save(preferences)
    }
  }, [preferences])

  const handleSiteSettingsChange = useCallback((
    currentPreferences: Preferences,
    site_settings: SiteSettings
  ) => {
    console.log('site settings change', site_settings)
    if (site_settings.length === 0) {
      alert('站点配置项无法留空')
    } else {
      setPreferences((latest) => {
        return {
          ...latest,
          ...currentPreferences,
          site_settings,
        }
      })
    }
  }, [])

  const innerEl = useAdjustMarginCenter(
    preferences ? preferences.site_settings : [],
    Boolean(preferences) && Boolean(limit)
  )

  return (
    <div className={s.OptionsContainer}>
      <div ref={innerEl} className={s.OptionsInner}>{
        useMemo(() => {
          if (failure) {
            return <Failure error={failure} />
          } else if (!preferences || !limit) {
            return <Loading />
          } else {
            return (
              <>
                <header className={s.OptionsHeader}>
                  <SettingHeader version={pkg.version} />
                </header>
                <div className={s.OptionsCols}>
                  <div className={s.OptionsCol} style={{ minWidth: '590px' }}>
                    {/* <SettingItem>
                      <SettingSwitch
                        title="使用 Poker 关键字启动搜索"
                        description="在搜索栏中输入「Poker + 空格 + 想要搜索的内容」才使用发牌手"
                      />
                    </SettingItem> */}

                    <SettingItem title="使用方法介绍">
                      <p>
                        直接拖拽右边已经录入网站的方框，能进行发牌的顺序调换。<br />
                        点击 + 号能添加新的网站。
                      </p>

                      <p></p>
                      <p>
                        添加新网站时，在 URL 中把想要搜索的关键字替换为 <b style={{ color: '#d22a44' }}>%poker%</b><br />
                        例：<br />
                        https://www.google.com/search?q=<b style={{ color: '#d22a44' }}>%poker%</b><br />
                        https://www.youtube.com/results?search_query=<b style={{ color: '#d22a44' }}>%poker%</b><br />
                        https://github.com/search?q=<b style={{ color: '#d22a44' }}>%poker%</b><br />
                      </p>
                    </SettingItem>

                    <SettingItem title="关于">
                      <p>
                        遇到了麻烦/故障？请上 <a href="https://github.com/vechk/poker/issues" target="_blank" rel="noreferrer">GitHub issues</a> 反馈
                      </p>
                      <p>
                        Inspiried by <a href="https://www.smartisan.com/tnt/os" target="_blank" rel="noreferrer">Smartisian TNT</a> Poker Dealer<br />
                        Made by <a href="http://vec.moe" target="_blank" rel="noreferrer">Vec</a><br />
                        Designed by <a href="https://t.me/nt_cubic" target="_blank" rel="noreferrer">NT³</a>
                      </p>
                      <p></p>
                      <p></p>
                    </SettingItem>
                  </div>
                  <div className={s.OptionsCol}>
                    <SiteSettingsManager
                      limit={limit}
                      siteSettings={preferences.site_settings}
                      onUpdate={(updateId, newSiteOption) => {
                        setPreferences(latestPreferences => {
                          if (!latestPreferences) {
                            return undefined
                          } else {
                            return {
                              ...latestPreferences,
                              site_settings: map(settings_row => {
                                const row = settings_row.row
                                const find_idx = findIndex(propEq('id', updateId), row)
                                if (find_idx === -1) {
                                  return settings_row
                                } else {
                                  return {
                                    ...settings_row,
                                    row: update(find_idx, newSiteOption, row)
                                  }
                                }
                              }, latestPreferences.site_settings)
                            }
                          }
                        })
                      }}
                      onChange={curry(handleSiteSettingsChange)(preferences)}
                    />
                    <ImportExport
                      siteSettings={preferences.site_settings}
                      onImport={curry(handleSiteSettingsChange)(preferences)}
                    />
                  </div>
                </div>
              </>
            )
          }
        }, [failure, handleSiteSettingsChange, limit, preferences])
      }</div>
    </div>
  )
}
