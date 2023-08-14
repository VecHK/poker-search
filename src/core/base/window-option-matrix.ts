import { curry, nth, compose } from 'ramda'
import cfg from '../../config'
import { Matrix, Row } from '../common'

import {
  toSearchURL,
  addMobileIdentifier,
  SiteOption,
  SiteSettings,
  toMatrix
} from '../../preferences/site-settings'

export type WindowOptionType = 'NORMAL' | 'FILL' | 'EMPTY' | 'PLAIN'
type ComposeSearchURLFn = (keyword: string) => string
type DefineWindowOption<T extends WindowOptionType, W extends number, S> = {
  type: T
  width_size: W
  site_option: S
  composeSearchURL: ComposeSearchURLFn
}

export type WindowOption =
  DefineWindowOption<'NORMAL', number, SiteOption> |
  DefineWindowOption<'FILL', 1, undefined> |
  DefineWindowOption<'EMPTY', 1, undefined> |
  DefineWindowOption<'PLAIN', 1, undefined>

type WindowOptionRow = Array<WindowOption>
export type WindowOptionMatrix = Array<WindowOptionRow>

function ComposeSearchURL(
  plain_window_url_pattern: string,
  site_row: Row<SiteOption>,
  col: number
): ComposeSearchURLFn {
  const site_opt = nth(col, site_row)
  if (site_opt === undefined) {
    return curry(toSearchURL)(plain_window_url_pattern)
  } else {
    const toUrl = curry(toSearchURL)(site_opt.url_pattern)
    if (site_opt.access_mode === 'MOBILE') {
      return compose(addMobileIdentifier, toUrl)
    } else {
      return toUrl
    }
  }
}

function fillRow(
  plain_window_url_pattern: string,
  max_window_per_line: number,
  site_row: Row<SiteOption>,
): WindowOptionMatrix {
  let result: WindowOptionRow = []

  for (let idx = 0; idx < max_window_per_line; ++idx) {
    const composeSearchURL = ComposeSearchURL(plain_window_url_pattern, site_row, idx)
    const site_option = site_row[idx]
    console.log('idx', idx, max_window_per_line, site_option)

    if (result.length >= max_window_per_line) {
      // 超过了，
      // const remain: Row<SiteOption> = site_row.slice(idx, max_window_per_line)
      const remain: Row<SiteOption> = site_row.slice(idx, max_window_per_line)
      console.warn('超过了', remain, result.length, max_window_per_line)

      if (remain.length) {
        return [
          result.slice(0, max_window_per_line),
          ...fillRow(plain_window_url_pattern, max_window_per_line, remain),
        ]
      } else {
        return [ result ]
      }
    }

    if (site_option === undefined) {
      result.push({
        type: 'PLAIN', width_size: 1, site_option: undefined, composeSearchURL,
      })
    } else {
      result.push({
        type: 'NORMAL',
        width_size: site_option.width_size,
        site_option,
        composeSearchURL,
      })
      if (site_option.width_size > 1) {
        for (let r = site_option.width_size; r > 1; --r) {
          result.push({
            type: 'FILL',
            width_size: 1,
            site_option: undefined,
            composeSearchURL,
          })
        }
      }
    }
  }

  return [ result ]
}

function createWindowOptionMatrix(
  plain_window_url_pattern: string,
  max_window_per_row: number,
  site_matrix: Matrix<SiteOption>,
): WindowOptionMatrix {
  if (site_matrix.length === 0) {
    return []
  } else {
    const [cols, ...remain_matrix] = site_matrix
    return [
      ...fillRow(plain_window_url_pattern, max_window_per_row, cols),
      ...createWindowOptionMatrix(plain_window_url_pattern, max_window_per_row, remain_matrix)
    ]
    // if (cols.length > max_window_per_row) {
    //   return createSearchMatrix(
    //     plain_window_url_pattern,
    //     max_window_per_row,
    //     [
    //       cols.slice(0, max_window_per_row),
    //       cols.slice(max_window_per_row, cols.length),
    //       ...remain_matrix
    //     ],
    //   )
    // } else {
    //   return [
    //     ...fillRow(plain_window_url_pattern, max_window_per_row, cols),
    //     ...createSearchMatrix(plain_window_url_pattern, max_window_per_row, remain_matrix)
    //   ]
    // }
  }
}

export function initWindowOptionMatrix(
  max_window_per_line: number,
  site_settings: SiteSettings
) {
  const search_matrix = createWindowOptionMatrix(
    cfg.PLAIN_SEARCH_WINDOW_URL_PATTERN,
    max_window_per_line,
    toMatrix(site_settings),
  )
  console.warn('search_matrix', search_matrix, toMatrix(site_settings))
  const search_count = search_matrix.flat().length
  const total_row = Math.ceil(search_count / max_window_per_line)

  return [ total_row, search_matrix ] as const
}
