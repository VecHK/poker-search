import React, { useCallback, useEffect, useMemo, useState } from 'react'
import pkg from '../../../package.json'
import { load, Options, save } from '../../options'
import './Options.css'

import SettingHeader from './Component/SettingHeader'
import SettingItem from './Component/SettingItem'
import SettingLink from './Component/SettingLink'
import SettingSwitch from './Component/SettingSwitch'
import SiteOptionManage from './Component/SiteOptionManage'
import Loading from '../../components/Loading'
import Failure from './Component/Failure'

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

  return (
    <div className="OptionsContainer">
      <div className="OptionsInner">{
        useMemo(() => {
          if (failure) {
            return <Failure error={failure} />
          } else if (!options) {
            return <Loading />
          } else {
            return (
              <>
                <div className="OptionsCol" style={{ minWidth: '590px' }}>
                  <SettingHeader version={pkg.version} />

                  <SettingItem><SettingLink title="关于" /></SettingItem>
                  <SettingItem><SettingLink title="使用方式" /></SettingItem>

                  <SettingItem>
                    <SettingSwitch
                      title="使用 Poker 关键字启动搜索"
                      description="在搜索栏中输入「Poker + 空格 + 想要搜索的内容」才使用发牌手"
                    />
                  </SettingItem>
                </div>
                <div className="OptionsCol">
                  <SiteOptionManage
                    siteMatrix={options.site_matrix}
                    onChange={(newMatrix) => {
                      console.log('matrix change', newMatrix)
                      setOptions({
                        ...options,
                        site_matrix: newMatrix
                      })
                      save({
                        ...options,
                        site_matrix: newMatrix
                      })
                    }}
                  />
                </div>
              </>
            )
          }
        }, [failure, options])
      }</div>
    </div>
  )
}
