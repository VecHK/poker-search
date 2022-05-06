import { Matrix } from '../common'
import { SearchWindow } from './window'

export function isCurrentRow(
  matrix: Matrix<SearchWindow>,
  row: number
) {
  return row === (matrix.length - 1)
}
