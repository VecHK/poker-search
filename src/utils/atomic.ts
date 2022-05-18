const createMemo = <Data extends unknown>(data: Data) => [
  () => data,
  (newData: Data) => { data = newData }
] as const

export default function Atomic() {
  const [ getProcessing, setProcessing ] = createMemo<Promise<unknown> | null>(null)

  return async function atomic<T>(
    task: () => Promise<T>,
  ): Promise<T> {
    const processing = getProcessing()
    if (processing !== null) {
      try {
        await processing
      } finally {
        return atomic(task)
      }
    } else {
      const new_processing = task()
      setProcessing(new_processing)
      try {
        await new_processing
      } finally {
        setProcessing(null)
        return new_processing
      }
    }
  }
}
