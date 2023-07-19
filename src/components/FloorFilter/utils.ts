import { range } from 'ramda'
import { SiteSettingFloorID } from '../../preferences'

export function incrementDetecting(p: number, filtered: number[]): number[] {
  if (filtered.indexOf(p) !== -1) {
    return [p, ...incrementDetecting(p + 1, filtered)]
  } else {
    return []
  }
}

type FloorPoint = number
type FloorPointMap = FloorPoint[]
type Range = Readonly<[FloorPoint, FloorPoint]>

export function getSelectedRangeList(selected_index_list: FloorPointMap): Array<Range> {
  let result: Array<Range> = []
  let pass: FloorPoint[] = []

  selected_index_list.forEach((point, idx) => {
    if (pass.indexOf(idx) === -1) {
      const detected = incrementDetecting(point, selected_index_list)
      pass = [...pass, ...detected.map((p) => selected_index_list.indexOf(p))]

      result.push(
        [ Math.min(...detected),  Math.max(...detected) ] as const
      )
    }
  })

  return result
}

export function clearOutRangeFloors(max_floor: number, floors: FloorPointMap) {
  return floors.filter((selected_floor_idx) => {
    return (selected_floor_idx >= 0) && (selected_floor_idx < max_floor)
  })
}

export function rangeToFloorsRaw([start, end]: Range) {
  if (Math.abs(end - start) === 0) {
    return [start]
  } else {
    if (end > start) {
      return range(start, end + 1)
    } else {
      return range(end, start + 1)
    }
  }
}

export function toSelectedFloorIds(
  floor_ids: SiteSettingFloorID[],
  filtered_list: SiteSettingFloorID[],
): SiteSettingFloorID[] {
  return floor_ids.filter((id) => {
    return filtered_list.indexOf(id) === -1
  })
}

export function toSelectedFloorIdx(
  floor_ids: SiteSettingFloorID[],
  filtered_list: SiteSettingFloorID[],
): number[] {
  return toSelectedFloorIds(floor_ids, filtered_list).map((id) => {
    return floor_ids.indexOf(id)
  })
}
