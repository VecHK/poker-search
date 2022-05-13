import { Options } from './'
import { getDefaultSiteMatrix } from './site-matrix'

export default async function getDefaultOptions(
  append: Partial<Options> = {}
): Promise<Options> {
  return {
    version: 2,
    site_matrix: await getDefaultSiteMatrix(),
    ...append,
  }
}
