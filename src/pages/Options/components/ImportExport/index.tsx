import React, { useCallback } from 'react'
import cfg from '../../../../config'
import { SiteSettings } from '../../../../preferences'
import { exportSiteSettingsData, parseSiteSettingsData } from '../../../../preferences/site-settings'

import s from './index.module.css'

function toDataHref(site_settings: SiteSettings): string {
  const json = exportSiteSettingsData(site_settings)
  return `data:text/json;charset=utf-8,${encodeURIComponent(json)}`
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
        const newSiteSettings = parseSiteSettingsData(raw)
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
