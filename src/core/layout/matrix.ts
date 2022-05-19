import { Matrix } from '../common'

export function isCurrentRow<T>(
  matrix: Matrix<T>,
  row: number
) {
  return row === (matrix.length - 1)
}
