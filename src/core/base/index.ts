import { Memo } from 'vait'
import cfg from '../../config'
import { load as loadEnvironment, Environment } from '../../environment'
import { load as loadPreferences, Preferences, SiteSettingFloorID } from '../../preferences'
import { getCurrentDisplayLimit, Limit } from './limit'
import { autoAdjustHeight, autoAdjustWidth } from './auto-adjust'
import { initSearchMatrix, SearchMatrix } from './search-matrix'
import { getControlWindowHeight } from './control-window-height'
import { getFilteredFloor } from '../../x-state/filtered-floor'

function selectSiteSettingsByFiltered(
  source_site_settings: Preferences['site_settings'],
  filteredFloor: SiteSettingFloorID[]
) {
  return source_site_settings.filter(s => {
    return filteredFloor.indexOf(s.id) === -1
  })
}

export type RevertContainerID = number | undefined
type BaseInfo = {
  window_height: number
  window_width: number
  gap_horizontal: number
  titlebar_height: number
}
export type Base = Readonly<{
  limit: Limit
  platform: chrome.runtime.PlatformInfo,
  info: BaseInfo,
  preferences: Preferences,
  search_matrix: SearchMatrix
  layout_width: number
  layout_height: number

  filtered_site_settings: Preferences['site_settings']

  control_window_height: number

  init_filtered_floor: SiteSettingFloorID[]

  getRevertContainerId: () => RevertContainerID
  setRevertContainerId: (r: RevertContainerID) => void
}>

async function initBase(
  environment: Environment,
  preferences: Preferences,
  revert_container_id: RevertContainerID,
): Promise<Base> {
  const [
    limit,
    platform,
    init_filtered_floor
  ] = await Promise.all([
    getCurrentDisplayLimit(),
    chrome.runtime.getPlatformInfo(),
    getFilteredFloor()
  ])

  const filtered_site_settings = selectSiteSettingsByFiltered(
    preferences.site_settings,
    init_filtered_floor,
  )
  const control_window_height = getControlWindowHeight(filtered_site_settings)

  const gap_horizontal = cfg.SEARCH_WINDOW_GAP_HORIZONTAL

  const {
    max_window_per_line, total_width, window_width
  } = autoAdjustWidth(gap_horizontal, limit.width)

  const [
    total_row,
    search_matrix
  ] = initSearchMatrix(max_window_per_line, filtered_site_settings)

  const { window_height, total_height } = autoAdjustHeight(
    [...cfg.SEARCH_WINDOW_HEIGHT_LIST],
    control_window_height,
    total_row,
    environment.titlebar_height,
    limit.height
  )

  const [getRevertContainerId, setRevertContainerId] = Memo(revert_container_id)

  return Object.freeze({
    limit,
    platform,
    preferences,
    search_matrix,

    filtered_site_settings,

    layout_width: total_width,
    layout_height: total_height,

    control_window_height,

    getRevertContainerId,
    setRevertContainerId,

    init_filtered_floor,

    info: {
      window_height,
      window_width,
      gap_horizontal,
      titlebar_height: environment.titlebar_height,
    }
  })
}

export async function createBase(from_window_id: RevertContainerID) {
  const [environment, preferences] = await Promise.all([
    loadEnvironment(),
    loadPreferences()
  ])

  return initBase(environment, preferences, from_window_id)
}
