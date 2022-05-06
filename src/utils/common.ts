import { curry, map, nth, range } from 'ramda'

const trueOrFalse = () => Math.round(Math.random())
const backCode = () => 65 + Math.round(Math.random() * 25)
const randomChar = (lower = 0) => String.fromCharCode(backCode() + (lower && 32))
export const randomString = (length: number, lower = 0): string => randomChar(lower && trueOrFalse()) + (--length ? randomString(length, lower) : '')

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

export type Row<T> = Array<T>
export type Matrix<T> = Array<Row<T>>

export function mapMatrix<NU extends unknown, U extends unknown>(
  matrix: Matrix<U>,
  fn: (unit: U, line: number, index: number) => NU
): Matrix<NU> {
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

export function selectCol<U>(matrix: Matrix<U>, col: number): Row<U> {
  return map( curry(nth)(col), matrix )
}
