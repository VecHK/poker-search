import { createMemo } from 'vait'

type QueueFn<P> = (payload: P) => void
type Queue<P> = Array< QueueFn<P> >

function fetchQueue<P>(queue: Queue<P>, arg: P): void {
  if (queue.length !== 0) {
    const [fn, ...remaing_queue] = queue
    try {
      fn(arg)
    } finally {
      fetchQueue(remaing_queue, arg)
    }
  }
}

export type Signal<A> = Readonly<{
  isEmpty(): boolean
  trigger(payload: A): void
  receive(fn: QueueFn<A>): void
  unReceive(fn: QueueFn<A>): void
}>

export default function CreateSignal<A>(): Signal<A> {
  const [getQueue, setQueue] = createMemo<Queue<A>>([])

  return {
    isEmpty() {
      return Boolean(getQueue().length)
    },

    trigger(payload) {
      fetchQueue(getQueue(), payload)
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

type ChannelID = string | number

export function CreateChannel<C extends ChannelID, Payload extends unknown>() {
  const channels = new Map<C, Signal<Payload>>()

  function collectEmptyChannel() {
    const empty_channel: C[] = []
    for (const [channel, sig] of channels) {
      if (sig.isEmpty()) {
        empty_channel.push(channel)
      }
    }
    return empty_channel
  }

  function clearChannel() {
    const empty_channels = collectEmptyChannel()
    empty_channels.forEach(channel => {
      channels.delete(channel)
    })
  }
  
  const findChannel = (find_channel: C): Signal<Payload> => {
    const signal = channels.get(find_channel)
    clearChannel()
    if (signal === undefined) {
      channels.set(find_channel, CreateSignal<Payload>())
      return findChannel(find_channel)
    } else {
      return signal
    }
  }

  return findChannel
}
