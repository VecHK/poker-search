import React, { useCallback, useEffect, useMemo, useState } from 'react'
import pkg from '../../../package.json'
import { load, Options, save } from '../../options'

import SettingHeader from './Component/SettingHeader'
import SettingItem from './Component/SettingItem'
import SettingSwitch from './Component/SettingSwitch'
import SiteOptionManage from './Component/SiteOptionManage'
import Loading from '../../components/Loading'
import Failure from './Component/Failure'

import s from './Options.module.css'

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
    <div className={s.OptionsContainer}>
      <div className={s.OptionsInner}>{
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
                </div>
              </>
            )
          }
        }, [failure, options])
      }</div>
    </div>
  )
}
