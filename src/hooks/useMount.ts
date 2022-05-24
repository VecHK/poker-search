import { useEffect, useRef } from 'react'

const createMemo = <Data extends unknown>(data: Data) => [
  () => data,
  (newData: Data) => { data = newData }
] as const

export default function useMount() {
  const ref = useRef(createMemo(false))
  const [getMount, setMount] = ref.current

  useEffect(() => {
    setMount(true)
    return () => setMount(false)
  }, [setMount])

  return getMount
}
