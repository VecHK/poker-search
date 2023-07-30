import { concat } from 'ramda'
import BezierEasing from 'bezier-easing'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { saveStorageVersion } from '../../../../x-state/storage-version'

import s from './version.module.css'

const verPrefix = concat('v')
const updateDescriptionURL = concat(`https://github.com/VecHK/poker-search/releases/tag/`)

function randomNumber(range: number) {
  return Math.floor(Math.random() * range)
}
function randomRange(val_1: number, val_2: number) {
  const min = Math.min(val_1, val_2)
  return min + randomNumber( Math.max(val_1, val_2) - min )
}

function sign(v: number) {
  return (v < 0) ? -1 : 1
}

function VersionString({
  version,
  progress
}: { version: string, progress: number }) {
  const random_info = useMemo(() => (
    [...version].map(() => ({
      x: randomRange(120, 150),
      y: randomRange(-20, 20),
      r: randomRange(-12, 12),
    }))
  ), [version])

  const breaking_info = useMemo(() => (
    random_info.map((ri, idx) => ({
      ch: version[idx],
      opacity: 1 - progress,
      r: sign(ri.r) * (Math.abs(ri.r) * progress),
      x: sign(ri.x) * (Math.abs(ri.x) * progress),
      y: sign(ri.y) * (Math.abs(ri.y) * progress),
    }))
  ), [progress, random_info, version])

  return useMemo(() => (
    <span key={version} className={s.VersionString}>
      {
        breaking_info.map((b, idx) => (
          <span
            key={idx}
            className={s.VersionChar}
            style={{
              opacity: b.opacity,
              transform: `rotate(${b.r}deg) translate(${b.x}px, ${b.y}px)`,
            }}
          >{b.ch}</span>
        ))
      }
    </span>
  ), [breaking_info, version])
}

function useOffsetWidthFn<RefType extends HTMLElement>() {
  const ref = useRef<RefType>(null)

  const getOffsetWidth = useCallback(() => {
    return ref.current?.offsetWidth
  }, [])

  return [getOffsetWidth, ref] as const
}

type AnimateState = 'playing' | 'done'

function VersionInner({ current_version, new_version, onUpdateEffectPlayEnd }: {
  current_version: string
  new_version: string
  onUpdateEffectPlayEnd: () => void
}) {
  const [getCurrentWidth, currentRef] = useOffsetWidthFn<HTMLAnchorElement>()
  const [getNewWidth, newRef] = useOffsetWidthFn<HTMLAnchorElement>()

  const [animate_state, setAnimateState] = useState<AnimateState>('done')

  const is_diff = current_version !== new_version

  useEffect(() => {
    if (is_diff) {
      setAnimateState('playing')
    } else {
      setAnimateState('done')
    }
  }, [is_diff])

  const [new_info, setNewInfo] = useState({
    opacity: 0,
    moving: 0,
  })
  const [old_info, setOldInfo] = useState({
    progress: 0,
  })

  useEffect(() => {
    const INTERVAL = 15
    const NEW_DURATION = 500
    const OLD_DURATION = 300

    if (animate_state === 'done') return ;

    const current_width = getCurrentWidth()
    const new_width = getNewWidth()
    if (current_width === undefined || new_width === undefined) {
      return
    }

    const newTextFadeInEase = BezierEasing(0, 0, 0.5, 1.0)
    const newTextMovingEase = BezierEasing(0.72, 0.15, 0.34, 1.36)
    const oldTextBreakingEase = BezierEasing(0.31, 0.17, 0.5, 1.00)

    let new_text_starttime = -1
    let old_text_start_time = -1
    let end_time = -1
    const handle = requestAnimationFrame(function applyAnimate(t) {
      if (new_text_starttime === -1) {
        new_text_starttime = t
      }
      if (end_time === -1) {
        end_time = t + NEW_DURATION + OLD_DURATION
      }

      const progress_time = t - new_text_starttime
      const is_timeout = progress_time > NEW_DURATION
      let progress = is_timeout ? 1 : (progress_time / NEW_DURATION)

      const moving_length = INTERVAL + new_width
      const current_moving = moving_length * newTextMovingEase(progress)
      const moving = -(moving_length - current_moving)
      setNewInfo({
        opacity: newTextFadeInEase(progress),
        moving,
      })

      if (Math.abs(moving) < new_width) {
        if (old_text_start_time === -1) {
          old_text_start_time = t
          end_time = Math.max(
            new_text_starttime + NEW_DURATION,
            t + OLD_DURATION
          )
        }
        const old_progress_time = t - old_text_start_time
        const old_is_timeout = old_progress_time >= OLD_DURATION
        let old_progress = old_is_timeout ? 1 : (t - old_text_start_time) / (OLD_DURATION)
        setOldInfo({
          progress: oldTextBreakingEase(old_progress),
        })
      }

      if (t <= end_time) {
        requestAnimationFrame(applyAnimate)
      } else {
        onUpdateEffectPlayEnd()
      }
    })

    return () => {
      cancelAnimationFrame(handle)
    }
  }, [animate_state, getCurrentWidth, getNewWidth, onUpdateEffectPlayEnd])

  return (
    <div className={s.VersionInner}>
      {
        (animate_state === 'done') ? (
          <a
            ref={currentRef}
            className={s.Old}
            rel="noreferrer"
            target="_blank"
            href={updateDescriptionURL(current_version)}
          >
            <VersionString version={current_version} progress={0} />
          </a>
        ): (<>
          <a
            ref={currentRef}
            className={s.Old}
            rel="noreferrer"
            target="_blank"
            href={updateDescriptionURL(current_version)}
          >
            <VersionString version={current_version} progress={old_info.progress} />
          </a>
          <a
            ref={newRef}
            className={s.New}
            rel="noreferrer"
            target="_blank"
            href={updateDescriptionURL(new_version)}
            style={{
              opacity: new_info.opacity,
              transform: `translateX(${new_info.moving}px)`
            }}
          >
            <VersionString version={new_version} progress={0} />
          </a>
        </>)
      }
    </div>
  )
}

export default function Version({ currentVersion: _currentVersion, newVersion: _newVersion }: {
  currentVersion: string
  newVersion: string
}) {
  const [current_version, setCurrentVersion] = useState(_currentVersion)
  const [new_version, setNewVersion] = useState(_currentVersion)

  useEffect(() => {
    setTimeout(() => {
      setNewVersion(_newVersion)
    }, 1000)
  }, [_newVersion])

  return (
    <div className={s.Version}>
      <VersionInner
        current_version={verPrefix(current_version)}
        new_version={verPrefix(new_version)}
        onUpdateEffectPlayEnd={() => {
          setCurrentVersion(_newVersion)
          saveStorageVersion(_newVersion)
        }}
      />
    </div>
  )
}
