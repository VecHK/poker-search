import { nth, slice } from 'ramda'

type MatchResult = Readonly<[true, string, string] | [false]>

export default function matchSearchPattern(
  input_str: string
): MatchResult {
  const found = input_str.matchAll(/ |　/g)
  const match = nth(0, [...found])

  if (match) {
    const { index } = match
    if (index !== undefined) {
      return [
        true,
        slice(0, index, input_str),
        slice(index, input_str.length, input_str).trimStart()
      ] as const
    } else {
      return [ false ] as const
    }
  } else {
    return [ false ] as const
  }
}
