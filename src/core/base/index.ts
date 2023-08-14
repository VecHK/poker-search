import { curry } from 'ramda'
import { Memo } from 'vait'
import cfg from '../../config'
import { load as loadEnvironment, Environment } from '../../environment'
import { load as loadPreferences, Preferences, SiteSettingFloorID, SiteSettings } from '../../preferences'
import { hasStrongMobileAccessMode } from '../../preferences/site-settings'
import { getCurrentDisplayLimit, Limit } from './limit'
import { autoAdjustHeight, autoAdjustWidth } from './auto-adjust'
import { initWindowOptionMatrix } from './search-matrix'
import { getControlWindowHeight } from './control-window-height'
import { getFilteredFloor } from '../../x-state/filtered-floor'
import { specifyFloorIdxBySearchText } from '../../hooks/useSearchForm'

export const selectSiteSettingsByFiltered = curry((
  source_site_settings: Preferences['site_settings'],
  filtered_floors: SiteSettingFloorID[]
) => {
  return source_site_settings.filter(s => {
    return filtered_floors.indexOf(s.id) === -1
  })
})

export function getFilteredSiteSettingsBySearchText(
  search_text: string,
  source_site_settings: Preferences['site_settings'],
  filtered_floors: SiteSettingFloorID[]
) {
  const floor_idx = specifyFloorIdxBySearchText(search_text, source_site_settings)
  if (floor_idx.length) {
    return floor_idx.map(idx => source_site_settings[idx])
  } else {
    return selectSiteSettingsByFiltered(
      source_site_settings,
      filtered_floors
    )
  }
}

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

  console.warn('max_window_per_line', max_window_per_line)

  const [
    total_row,
    window_option_matrix,
    // search_matrix
  ] = initWindowOptionMatrix(max_window_per_line, site_settings)

  const { window_height, total_height } = autoAdjustHeight(
    [...cfg.SEARCH_WINDOW_HEIGHT_LIST],
    getControlWindowHeight( hasStrongMobileAccessMode(site_settings) ),
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
    window_option_matrix,
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
