import { adminRequest } from '../../shared/api/adminRequest.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export async function createCustomOrderRequest(token, formData) {
  let response
  try {
    response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/custom-orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
  } catch {
    throw new Error('Backend se connect nahi ho pa raha. Server aur API URL check karein.')
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.success === false) {
    const error = new Error(payload?.message || `Request failed (${response.status}).`)
    error.status = response.status
    throw error
  }
  return payload
}

export async function getAdminCustomOrderRequests({ page = 1, pageSize = 20, search = '', status = '' } = {}) {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    search,
    status,
  })
  const payload = await adminRequest(`/custom-orders/admin?${query}`)
  if (!Array.isArray(payload?.data) || !payload?.pagination) {
    throw new Error('Custom order requests response mein paginated list nahi mili.')
  }
  return { items: payload.data, pagination: payload.pagination }
}

export async function updateCustomOrderRequestStatus(id, status) {
  return adminRequest(`/custom-orders/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
