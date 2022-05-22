import cfg from '../config'
import { mapMatrix } from '../core/common'
import { SiteMatrix, Options, SiteOption } from './'
import { generateId } from './site-matrix'

export default function getDefaultOptions(
  append: Partial<Options> = {}
): Options {
  return {
    __is_poker__: true,
    version: 3,
    site_matrix: getDefaultSiteMatrix(),
    ...append,
  }
}

function getDefaultSiteMatrix(): SiteMatrix {
  return mapMatrix(
    cfg.DEFAULT_SITES,
    (url_pattern) => ({
      id: generateId(),
      icon: null,
      name: '__DEFAULT_NAME__',
      enable_mobile: cfg.DEFAULT_ENABLE_MOBILE,
      url_pattern
    })
  )
}

export function generateExampleOption(): SiteOption {
  return {
    id: generateId(),
    icon: cfg.DEFAULT_SITE_ICON,
    name: '_DEFAULT_NAME_',
    url_pattern: `https://example.com?search=${cfg.KEYWORD_REPLACEHOLDER}`,
    enable_mobile: cfg.DEFAULT_ENABLE_MOBILE,
  }
}
