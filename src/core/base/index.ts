import { curry } from 'ramda'
import { Memo } from 'vait'
import cfg from '../../config'
import { load as loadEnvironment, Environment } from '../../environment'
import { load as loadPreferences, Preferences, SiteSettingFloorID, SiteSettings } from '../../preferences'
import { getCurrentDisplayLimit, Limit } from './limit'
import { autoAdjustHeight, autoAdjustWidth } from './auto-adjust'
import { initSearchMatrix } from './search-matrix'
import { getControlWindowHeight } from './control-window-height'
import { getFilteredFloor } from '../../x-state/filtered-floor'

export const selectSiteSettingsByFiltered = curry((
  source_site_settings: Preferences['site_settings'],
  filteredFloor: SiteSettingFloorID[]
) => {
  return source_site_settings.filter(s => {
    return filteredFloor.indexOf(s.id) === -1
  })
})

export type LayoutInfo = ReturnType<typeof initLayoutInfo>
export function initLayoutInfo(
  environment: Environment,
  limit: Limit,
  site_settings: SiteSettings,
) {
  const gap_horizontal = cfg.SEARCH_WINDOW_GAP_HORIZONTAL
  const {
    max_window_per_line, total_width, window_width
  } = autoAdjustWidth(gap_horizontal, limit.width)

  const control_window_height = getControlWindowHeight(site_settings)

  const [
    total_row,
    search_matrix
  ] = initSearchMatrix(max_window_per_line, site_settings)

  const { window_height, total_height } = autoAdjustHeight(
    [...cfg.SEARCH_WINDOW_HEIGHT_LIST],
    control_window_height,
    total_row,
    environment.titlebar_height,
    limit.height
  )

  return {
    titlebar_height: environment.titlebar_height,
    gap_horizontal,
    max_window_per_line,
    total_width,
    window_width,
    total_row,
    search_matrix,
    window_height,
    total_height
  } as const
}

export type RevertContainerID = number | undefined

export type Base = Readonly<{
  environment: Environment
  limit: Limit
  platform: chrome.runtime.PlatformInfo,

  preferences: Preferences,

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

  const [getRevertContainerId, setRevertContainerId] = Memo(revert_container_id)

  return Object.freeze({
    environment,
    limit,
    platform,
    preferences,

    getRevertContainerId,
    setRevertContainerId,

    init_filtered_floor,
  })
}

export async function createBase(from_window_id: RevertContainerID) {
  const [environment, preferences] = await Promise.all([
    loadEnvironment(),
    loadPreferences()
  ])

  return initBase(environment, preferences, from_window_id)
}
