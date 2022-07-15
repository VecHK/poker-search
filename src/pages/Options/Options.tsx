import pkg from '../../../package.json'
import { Memo } from 'vait'
import { findIndex, map, propEq, update } from 'ramda'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { load as loadPreferences, Preferences } from '../../preferences'
import { SiteSettings } from '../../preferences/site-settings'
import { getCurrentDisplayLimit, Limit } from '../../core/base/limit'
import { Base } from '../../core/base'
import { sendMessage } from '../../message'

import { canUseRefocusWindow } from '../../can-i-use'

import usePreferences from './hooks/usePreferences'

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
  const { preferences, setPreferences, HandleSettingFieldChange, updatePreferencesField } = usePreferences({
    autoSave: true
  })
  const [limit, setLimit] = useState<Limit>()
  const [platform, setPlatform] = useState<Base['platform']>()
  const [failure, setFailure] = useState<Error>()
  const [managerKey, refreshManagerKey] = useKey()

  const isReady = Boolean(preferences) && Boolean(limit) && Boolean(platform)

  const refresh = useCallback(() => {
    setFailure(undefined)
    Promise.all([
      loadPreferences(),
      getCurrentDisplayLimit(),
      chrome.runtime.getPlatformInfo()
    ])
      .then(([preferences, limit, platform]) => {
        setPreferences(preferences)
        setLimit(limit)
        setPlatform(platform)
      })
      .catch(setFailure)
  }, [setPreferences])

  useEffect(() => {
    refresh()
  }, [refresh])

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
  }, [setPreferences])

  const [innerEl, adjustWidth] = useAdjustMarginCenter(isReady)

  return (
    <div className={s.OptionsContainer}>
      <div ref={innerEl} className={s.OptionsInner}>{
        useMemo(() => {
          if (failure) {
            return <Failure error={failure} />
          } else if (!preferences || !limit || !platform) {
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
                        description="在网页空白处点击右键，将会有「启动Poker」菜单项"
                        value={Boolean(preferences.launch_poker_contextmenu)}
                        onChange={(value) => {
                          updatePreferencesField('launch_poker_contextmenu', () => {
                            sendMessage('ChangeLaunchContextMenu', value)
                            return value
                          })
                        }}
                      />
                    </SettingItem>

                    <SettingItem title="强迫症选项">
                      <SettingSwitch
                        title="将每一层的页面填充满"
                        description="开启此选项后，每一层都会打开目前显示器所能容纳的最多页面数"
                        value={preferences.fill_empty_window}
                        onChange={HandleSettingFieldChange('fill_empty_window')}
                      />
                    </SettingItem>

                    {
                      !canUseRefocusWindow(platform) ? null : (
                        <SettingItem>
                          <SettingSwitch
                            title="「唤回 Poker」窗口"
                            description="开启后，左上角会出现一个小窗口。点击窗口中的「唤回 Poker」后，Poker 所有窗口都会置为最顶端"
                            value={preferences.refocus_window}
                            onChange={HandleSettingFieldChange('refocus_window')}
                          />
                        </SettingItem>
                      )
                    }

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
        }, [HandleSettingFieldChange, adjustWidth, failure, handleSiteSettingsChange, limit, managerKey, platform, preferences, refreshManagerKey, setPreferences, updatePreferencesField])
      }</div>
    </div>
  )
}
