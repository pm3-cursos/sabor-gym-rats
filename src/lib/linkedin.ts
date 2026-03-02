/**
 * Extracts the LinkedIn username (slug) from a profile URL.
 * Accepts both with and without trailing slash, with or without www.
 * Returns lowercase username or null if not found / invalid format.
 *
 * Example: "https://www.linkedin.com/in/joao-caetano/" → "joao-caetano"
 */
export function extractLinkedinUsername(profileUrl: string | null | undefined): string | null {
  if (!profileUrl) return null
  const match = profileUrl.toLowerCase().match(/linkedin\.com\/in\/([^/?#\s]+)/)
  if (!match) return null
  return match[1].replace(/\/$/, '').toLowerCase()
}

/**
 * Returns true if a profile URL contains a valid /in/username path.
 */
export function isValidLinkedinProfileUrl(url: string): boolean {
  return /linkedin\.com\/in\/[^/?#\s]+/.test(url.toLowerCase())
}
