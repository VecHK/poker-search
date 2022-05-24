export function getSearchword(): string | null {
  const sp = new URLSearchParams(window.location.search)

  return sp.get('q')
}
