import React, { CSSProperties, ReactNode, useMemo } from 'react'

import './FloorLayout.css'

type FloorHeight = Exclude<CSSProperties['height'], undefined>
type Floor = {
  height: FloorHeight
  node: ReactNode
}
export function FloorLayout({ floors, current }: { floors: Floor[]; current: number }) {
  const currentTop = useMemo(() => {
    if (floors.length === 0) {
      throw Error('floors.length is 0')
    }
    else if (current === 0) {
      return '0px'
    }

    const previousFloors = floors.filter((_, floorNumber) => {
      return floorNumber < current
    })

    const previousFloorsHeight = previousFloors.map(f => f.height)

    return `calc(-1 * (${previousFloorsHeight.join(' + ')}))`
  }, [current, floors])

  console.log('currentTop', currentTop)

  return (
    <div className="FloorLayout">
      <div className="FloorLayoutInner" style={{ top: currentTop }}>
        {
          floors.map((floor, idx) => {
            return (
              <div key={idx} className='Floor' style={{ height: floor.height }}>
                {floor.node}
              </div>
            )
          })
        }
      </div>
    </div>
  )
}
