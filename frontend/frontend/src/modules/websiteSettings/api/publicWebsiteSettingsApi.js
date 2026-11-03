const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export async function getPublicWebsiteSettings() {
  let response
  try {
    response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/website-settings`)
  } catch {
    throw new Error('Website settings server se load nahi ho payi.')
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `Website settings request failed (${response.status}).`)
  }
  if (!payload?.data || typeof payload.data !== 'object') {
    throw new Error('Website settings response mein data nahi mila.')
  }
  return payload.data
}
