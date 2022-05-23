import React, { useCallback } from 'react'
import cfg from '../../../../config'
import { Preferences, AllVersion, SiteSettings } from '../../../../preferences'
import getDefaultPreferences from '../../../../preferences/default'
import { updatePreferences } from '../../../../preferences/versions/update'

import s from './ImportExport.module.css'

function toDataHref(site_settings: SiteSettings): string {
  const exportData: Preferences = {
    ...getDefaultPreferences(),
    site_settings,
  }
  const json = encodeURIComponent(JSON.stringify(exportData, undefined, '  '))
  return `data:text/json;charset=utf-8,${json}`
}

function isPokerPreferences(obj: unknown): boolean {
  if ((typeof obj === 'object') && (obj !== null)) {
    const is_poker = Reflect.get(obj, '__is_poker__')
    if (typeof(is_poker) === 'boolean') {
      return is_poker
    } else {
      return false
    }
  } else {
    return false
  }
}

function parseJson<T>(json: string) {
  try {
    return JSON.parse(json) as T
  } catch (err) {
    throw Error('JSON 解析失败')
  }
}

function loadData(raw: string): SiteSettings {
  const prefs = parseJson(raw)

  if (!isPokerPreferences(prefs)) {
    throw Error('此文件似乎不是 Poker 的站点配置文件')
  } else {
    try {
      const { site_settings } = updatePreferences(prefs as AllVersion)
      return site_settings
    } catch (err) {
      console.error(err)
      throw Error('站点配置信息读取失败')
    }
  }
}

export default function ImportExport({ siteSettings, onImport }: {
  siteSettings: SiteSettings
  onImport(s: SiteSettings): void
}) {
  const readOnload = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    readerEvent: ProgressEvent<FileReader>
  ) => {
    if (readerEvent.target !== null) {
      const raw = readerEvent.target.result
      if (typeof raw !== 'string') {
        throw Error('错误的文件类型')
      } else {
        const newSiteSettings = loadData(raw)
        if (window.confirm(
          '你确定要导入吗？（这将删除当前的所有站点配置）'
        )) {
          onImport(newSiteSettings)
        }
      }
    }
  }, [onImport])

  return (
    <div className={s.ImportExport}>
      <label>
        <a
          className={s.Link}
          href={toDataHref(siteSettings)}
          download={cfg.EXPORT_SITE_SETTINGS_FILE_NAME}
        >导出站点配置</a>
      </label>
      <label>
        <input
          type="file"
          style={{ display: 'none' }}
          onChange={(e) => {
            const { files } = e.target
            if (files !== null) {
              if (files.length !== 0) {
                const file = files[0]
                const reader = new FileReader()
                reader.readAsText(file, 'UTF-8')
                reader.onerror = e => {
                  console.error('加载失败', e)
                  alert('加载失败')
                }
                reader.onload = (readerEvent) => {
                  try {
                    readOnload(e, readerEvent)
                  } catch (err) {
                    if (err instanceof Error) {
                      console.error(err)
                      alert(err.message)
                    } else {
                      throw err
                    }
                  } finally {
                    e.target.value = ''
                  }
                }
              }
            }
          }}
        />
        <span className={s.Link}>导入站点配置</span>
      </label>
    </div>
  )
}
