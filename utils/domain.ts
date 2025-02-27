export function extractDNSDomain(url: string) {
  if (!url) {
    return ''
  }

  try {
    if (!/^https?:\/\//.test(url)) {
      url = `https://${url}`
    }

    const uri = new URL(url)
    return uri.hostname
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Invalid URL: ${url}`, error)
    return ''
  }
}
