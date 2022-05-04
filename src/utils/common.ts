import { curry, map, range } from 'ramda'

export function constructMatrix<Unit extends unknown>(
  total_row: number,
  total_col: number,
  fn: (row: number, col: number) => Unit
): Unit[][] {
  const RowCallback = map(curry(fn), range(0, total_row))
  return map(
    rowFn => map(rowFn, range(0, total_col)),
    RowCallback
  )
}

export function mapMatrix<NU extends unknown, U extends unknown>(
  matrix: Array<Array<U>>,
  fn: (unit: U, line: number, index: number) => NU
): Array<Array<NU>> {
  const newMatrix = []
  for (let l = 0; l < matrix.length; ++l) {
    const line = matrix[l]
    const newLine: Array<NU> = []
    newMatrix.push(newLine)
    for (let i = 0; i < line.length; ++i) {
      const newUnit = fn(line[i], l, i)
      newLine.push(newUnit)
    }
  }
  return newMatrix
}
