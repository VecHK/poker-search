import { Signal } from 'vait'

type ChannelID = string | number
type Channel<C extends ChannelID, Payload> = (findChannel: C) => Signal<Payload>
export function CreateChannel<
  C extends ChannelID,
  Payload extends unknown
>(): Channel<C, Payload> {
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

  return (
    function findChannel(find_channel: C): Signal<Payload> {
      const signal = channels.get(find_channel)
      clearChannel()
      if (signal === undefined) {
        channels.set(find_channel, Signal<Payload>())
        return findChannel(find_channel)
      } else {
        return signal
      }
    }
  )
}
