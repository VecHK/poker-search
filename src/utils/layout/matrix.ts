import { SearchWindow } from './'

export function isCurrentRow(
  matrix: Array<Array<SearchWindow>>,
  row: number
) {
  return row === (matrix.length - 1)
}

export function MapMatrix<NU extends unknown, U extends unknown>(
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

type PlainUnit = null
type PlainMatrix = Array<Array<PlainUnit>>
export type Unit = PlainUnit | {
  url: string
  getWindowId: () => number
}

export function createPlainMatrix(
  windowCount: number,
  maxWindowPerLine: number
) {
  const matrix: PlainMatrix = []
  const line = Math.ceil(windowCount / maxWindowPerLine)
  for (let l = 0; l < line; ++l) {
    const line: Array<PlainUnit> = []
    for (let c = 0; c < maxWindowPerLine; ++c) {
      line.push(null)
    }
    matrix.push(line)
  }
  return matrix
}
