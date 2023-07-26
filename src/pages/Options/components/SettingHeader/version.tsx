import React, { useEffect, useMemo, useState } from 'react'
import { Transition } from 'react-transition-group'

import s from './version.module.css'
import useOffsetWidth from '../../../../components/FloorFilter/hooks/useOffsetWidth'
import { concat } from 'ramda'
import { saveStorageVersion } from '../../../../x-state/storage-version'

function random(range: number) {
  return Math.floor(Math.random() * range)
}
function randomRange(val_1: number, val_2: number) {
  const min = Math.min(val_1, val_2)
  return min + random( Math.max(val_1, val_2) - min )
}

function VersionString({ version, breaking }: { version: string, breaking: boolean }) {
  // const str_arr = useMemo(() => [...version], [version])
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const han = setTimeout(() => {
      setMounted(true)
    }, 10)
    return () => {
      clearTimeout(han)
      setMounted(false)
    }
  }, [])

  const breaking_info = useMemo(() => (
    [...version].map((ch, idx) => ({
      ch,
      opacity: (mounted && breaking) ? 0 : 1,
      x: (mounted && breaking) ? randomRange(150, 120) : 0,
      y: (mounted && breaking) ? randomRange(-20, 20) : 0,
      rotate: (mounted && breaking) ? randomRange(-12, 12) : 0,
    }))
  ), [mounted, breaking, version])

  console.log('breaking_info', breaking, version, breaking_info)

  return useMemo(() => (
    <div key={version} className={s.VerSionString}>
      {
        breaking_info.map((b, idx) => (
          <span
            key={idx}
            className={s.VersionChar}
            style={{
              opacity: b.opacity,
              transform: `rotate(${b.rotate}deg) translate(${b.x}px, ${b.y}px)`,
              transitionTimingFunction: 'ease',
              transition: `opacity 200ms ease-in, transform 250ms cubic-bezier(0.21, 0.9, 1, 1)`,
              transitionDelay: '160ms',
            }}
          >{b.ch}</span>
        ))
      }
    </div>
  ), [breaking_info, version])
}

function VersionInner({ current_version, new_version }: {
  current_version: string
  new_version: string
}) {
  const [inner_width, innerRef] = useOffsetWidth<HTMLDivElement>()

  const is_diff = current_version !== new_version

  const transitionStyles: Record<string, React.CSSProperties> = {
    entering: { opacity: 1, left: `0px` },
    entered:  { opacity: 1, left: `0px` },
    exiting:  { opacity: 0, left: `-${inner_width + 20}px`  },
    exited:  { opacity: 0, left: `-${inner_width + 20}px` },
  }

  return (
    <div className={s.VersionInner} ref={innerRef}>
        <Transition in={is_diff} timeout={160+282+350}>
          {state => (
            <>
              <div
                key={current_version}
                className={s.Old}
                style={{}}
              >
                <VersionString
                  key={current_version}
                  version={current_version}
                  breaking={is_diff}
                />
              </div>
              <div
                className={s.New}
                style={{
                  transition: 'left 350ms cubic-bezier(0.72, 0.15, 0.34, 1.36) 0s, opacity 150ms ease-out 0s',
                  ...transitionStyles[state],
                }}
              >
                {/* new ver */}
                <VersionString version={new_version} breaking={false} />
                {/* 超过屏幕所能并列显示的窗口数{state} */}
              </div>
            </>
          )}
        </Transition>
      </div>
  )
}

const verPrefix = concat('v')

export default function Version({ currentVersion, newVersion }: {
  currentVersion: string
  newVersion: string
}) {
  const [new_version, setNewVersion] = useState(currentVersion)

  useEffect(() => {
    setTimeout(() => {
      setNewVersion(newVersion)
      saveStorageVersion(newVersion)
    }, 1000)
  }, [newVersion])

  return (
    <div className={s.Version}>
      <VersionInner
        current_version={verPrefix(currentVersion)}
        new_version={verPrefix(new_version)}
      />
      {/* <VersionString version={version_string} /> */}
    </div>
  )
}
