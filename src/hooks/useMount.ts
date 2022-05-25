import { useEffect, useRef } from 'react'
import { createMemo } from 'vait'

export default function useMount() {
  const ref = useRef(createMemo(false))
  const [getMount, setMount] = ref.current

  useEffect(() => {
    setMount(true)
    return () => setMount(false)
  }, [setMount])

  return getMount
}
