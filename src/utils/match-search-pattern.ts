import { nth, pipe, slice } from 'ramda'

type MatchResult = Readonly<[true, string, string] | [false]>

const blankCharExp = / |　/g

export default function matchSearchPattern(
  input_str: string
): MatchResult {
  const found = input_str.matchAll(blankCharExp)
  const match = nth(0, [...found])

  if (match) {
    const { index } = match
    if (index !== undefined) {
      const [ getLeft, getRight ] = [
        slice(0, index),
        pipe(
          slice(index, input_str.length),
          (s: string) => s.trimStart()
        )
      ]

      return [ true, getLeft(input_str), getRight(input_str) ]
    } else {
      return [ false ]
    }
  } else {
    return [ false ]
  }
}
