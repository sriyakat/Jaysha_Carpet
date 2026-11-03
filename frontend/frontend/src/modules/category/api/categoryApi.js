const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const CATEGORIES_URL = `${API_BASE_URL.replace(/\/$/, '')}/categories`

async function request(path = '', options = {}) {
  let response

  try {
    response = await fetch(`${CATEGORIES_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Backend se connect nahi ho pa raha. Server aur API URL check karein.')
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed (${response.status}).`)
  }

  if (payload?.success === false) {
    throw new Error(payload.message || 'Request complete nahi ho saki.')
  }

  return payload
}

export async function getCategories() {
  const payload = await request()
  return Array.isArray(payload?.data) ? payload.data : []
}

export async function createCategory(category) {
  return request('', {
    method: 'POST',
    body: JSON.stringify(category),
  })
}

export async function updateCategory(id, category) {
  return request(`/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(category),
  })
}

export async function deleteCategory(id) {
  return request(`/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
