// Internal matcher helpers shared by every domain searcher.
// `matches` checks whether a text (plus optional keyword blob)
// contains the current query string. `getScore` ranks exact and
// prefix matches higher for the final sort.

export function makeMatcher(q: string) {
  return (text: string, kw: string = ''): boolean => {
    if (!text) return false
    const lower = text.toLowerCase()
    return lower.includes(q) || (kw ? kw.toLowerCase().includes(q) : false)
  }
}

export function getScore(title: string, subtitle: string, q: string): number {
  const t = title.toLowerCase()
  const s = subtitle.toLowerCase()
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (t.includes(` ${q}`)) return 60
  if (s.startsWith(q)) return 40
  return 20
}
