import { createMemo } from 'vait'

type QueueFn<A> = (arg: A) => void
type Queue<A> = Array< QueueFn<A> >

function _trigger<A>(queue: Queue<A>, arg: A): void {
  if (queue.length !== 0) {
    const [fn, ...remaing_queue] = queue
    try {
      fn(arg)
    } finally {
      _trigger(remaing_queue, arg)
    }
  }
}

export type Signal<A> = Readonly<{
  trigger(arg: A): void
  receive(fn: QueueFn<A>): void
  unReceive(fn: QueueFn<A>): void
}>

export default function CreateSignal<A>(): Signal<A> {
  const [getQueue, setQueue] = createMemo<Queue<A>>([])


  return {
    trigger(arg) {
      _trigger(getQueue(), arg)
    },

    receive(fn) {
      setQueue([...getQueue(), fn])
    },

    unReceive(removeFn) {
      setQueue(
        getQueue().filter((fn) => {
          return fn !== removeFn
        })
      )
    },
  } as const
}
