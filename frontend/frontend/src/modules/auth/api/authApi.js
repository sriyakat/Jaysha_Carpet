const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const AUTH_URL = `${API_BASE_URL.replace(/\/$/, '')}/auth`

async function request(path, body) {
  let response

  try {
    response = await fetch(`${AUTH_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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

export async function loginAdmin(credentials) {
  return request('/login', credentials)
}

export async function createAdmin(admin) {
  return request('/setup-admin', admin)
}
