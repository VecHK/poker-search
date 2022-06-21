import { useEffect, useRef } from 'react'
import { Memo } from 'vait'

export default function useMount() {
  const ref = useRef(Memo(false))
  const [getMount, setMount] = ref.current

  useEffect(() => {
    setMount(true)
    return () => setMount(false)
  }, [setMount])

  return getMount
}
