const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export async function adminRequest(path, options = {}) {
  let response
  let token = ''

  try {
    const session = JSON.parse(sessionStorage.getItem('admin-session') || 'null')
    token = typeof session?.token === 'string' ? session.token : ''
  } catch {
    sessionStorage.removeItem('admin-session')
  }

  try {
    response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}${path}`, {
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Backend se connect nahi ho pa raha. Server aur API URL check karein.')
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `Request failed (${response.status}).`)
  }
  return payload
}

export function getAdminList(payload, resourceName) {
  if (!Array.isArray(payload?.data)) {
    throw new Error(`${resourceName} response mein list nahi mili.`)
  }
  return payload.data
}
