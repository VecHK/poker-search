import { nth, pipe, slice } from 'ramda'

type MatchResult = Readonly<[true, string, string] | [false]>

function trimOne(str: string) {
  const [, ...remain] = str
  return remain.join('')
}

export default function matchSearchPattern(
  input_str: string
): MatchResult {
  const found = input_str.matchAll(/ |　/g)
  const match = nth(0, [...found])

  if (match) {
    const { index } = match
    if (index !== undefined) {
      const [ getLeft, getRight ] = [
        slice(0, index),
        pipe(
          slice(index, input_str.length),
          trimOne
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
