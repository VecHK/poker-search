import pkg from '../../../package.json'
import { Memo } from 'vait'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { findIndex, map, propEq, update } from 'ramda'

import { load as loadPreferences, save as savePreferences, Preferences } from '../../preferences'
import { SiteSettings } from '../../preferences/site-settings'
import { getCurrentDisplayLimit, Limit } from '../../core/base/limit'
import { getControlWindowId } from '../../x-state/control-window-launched'
import { sendMessage } from '../../message'

import SettingHeader from './Component/SettingHeader'
import SiteSettingsManager from './Component/SiteSettingsManager'
import Loading from '../../components/Loading'
import Failure from './Component/Failure'
import ImportExport from './Component/ImportExport'

import Help from './Component/Help'
import About from './Component/About'
import SettingItem from './Component/SettingItem'
import SettingSwitch from './Component/SettingSwitch'
import SettingItemTitle from './Component/SettingItem/SettingItemTitle'

import s from './Options.module.css'

const [getAdjustTask, setAdjustTask] = Memo<NodeJS.Timeout | null>(null)

function useAdjustMarginCenter(enable: boolean) {
  const ref = useRef<HTMLDivElement>(null)

  const _adjust = useCallback((ref: React.RefObject<HTMLDivElement>) => {
    console.log('adjust')

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

  const adjust = useCallback((ref: React.RefObject<HTMLDivElement>, timeout: number) => {
    console.log('adjust')

    if (getAdjustTask() === null) {
      setAdjustTask(
        setTimeout(() => {
          _adjust(ref)
          setAdjustTask(null)
        }, timeout)
      )
    }
  }, [_adjust])

  useEffect(() => {
    const el = ref.current

    if (el) {
      el.style['transition'] = 'margin-left 382ms'
    }

    _adjust(ref)
  }, [_adjust])

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined = undefined
    const resizeHandler = () => {
      if (timer !== undefined) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => {
        _adjust(ref)
      }, 300)
    }
    window.addEventListener('resize', resizeHandler)
    return () => {
      clearTimeout(timer as unknown as number)
      window.removeEventListener('resize', resizeHandler)
    }
  })

  return [ref, (timeout: number) => adjust(ref, timeout)] as const
}

function useKey() {
  const [key, setKey] = useState(`${Date.now()}`)
  return [key, function updateKey() { setKey(`${Date.now()}`) }] as const
}

export default function OptionsPage() {
  const [preferences, setPreferences] = useState<Preferences>()
  const [limit, setLimit] = useState<Limit>()
  const [failure, setFailure] = useState<Error>()
  const [managerKey, refreshManagerKey] = useKey()

  const refresh = useCallback(() => {
    setFailure(undefined)
    Promise.all([loadPreferences(), getCurrentDisplayLimit()])
      .then(([preferences, limit]) => {
        setPreferences(preferences)
        setLimit(limit)
      })
      .catch(setFailure)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (preferences !== undefined) {
      savePreferences(preferences)
    }
  }, [preferences])

  const handleSiteSettingsChange = useCallback((
    currentPreferences: Preferences,
    site_settings: SiteSettings
  ): Readonly<[boolean, string]> => {
    console.log('site settings change', site_settings)
    if (site_settings.length === 0) {
      return [false, '站点配置项无法留空']
    } else {
      setPreferences((latest) => {
        return {
          ...latest,
          ...currentPreferences,
          site_settings,
        }
      })
      return [true, 'OK']
    }
  }, [])

  const [innerEl, adjustWidth] = useAdjustMarginCenter(
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
                  <div
                    className={s.OptionsCol}
                    style={{
                      minWidth: '590px',
                      maxWidth: '590px',
                      width: '590px',
                    }}
                  >
                    <Help />

                    <SettingItem>
                      <SettingSwitch
                        title="右键菜单栏「启动Poker」"
                        value={Boolean(preferences.launch_poker_contextmenu)}
                        onChange={async (newValue) => {
                          console.log('preferences.launch_poker_contextmenu change', newValue)
                          const control_window_id = await getControlWindowId()
                          if (control_window_id !== null) {
                            alert('修改这个设置项需要先关闭 Poker 控制窗')
                            sendMessage('Refocus', null)
                          } else {
                            sendMessage('ChangeLaunchContextMenu', newValue)
                            setPreferences((latestPreferences) => {
                              if (!latestPreferences) {
                                return undefined
                              } else {
                                return {
                                  ...latestPreferences,
                                  launch_poker_contextmenu: newValue
                                }
                              }
                            })
                          }
                        }}
                        description="在网页空白处点击右键，将会有「启动Poker」菜单项"
                      />
                    </SettingItem>

                    <About />
                  </div>
                  <div className={s.OptionsCol}>
                    <SettingItemTitle>站点配置</SettingItemTitle>
                    <SiteSettingsManager
                      key={managerKey}
                      limit={limit}
                      adjustWidth={adjustWidth}
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
                      onChange={newSettings => {
                        const [isUpdate, message] = handleSiteSettingsChange(preferences, newSettings)
                        if (!isUpdate) {
                          refreshManagerKey()
                          alert(message)
                        }
                      }}
                    />
                    <ImportExport
                      siteSettings={preferences.site_settings}
                      onImport={(newSettings) => {
                        const [isUpdate, message] = handleSiteSettingsChange(preferences, newSettings)
                        if (!isUpdate) {
                          alert(message)
                        }

                        refreshManagerKey()
                      }}
                    />
                  </div>
                </div>
              </>
            )
          }
        }, [adjustWidth, failure, handleSiteSettingsChange, limit, managerKey, preferences, refreshManagerKey])
      }</div>
    </div>
  )
}
