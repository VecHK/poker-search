export default function getQuery(key: string): string | null {
  const usp = new URLSearchParams(window.location.search)

  return usp.get(key)
}
