const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const ORDERS_URL = `${API_BASE_URL.replace(/\/$/, '')}/orders`

function getAdminToken() {
  try {
    const session = JSON.parse(sessionStorage.getItem('admin-session') || 'null')
    return typeof session?.token === 'string' ? session.token : ''
  } catch {
    sessionStorage.removeItem('admin-session')
    return ''
  }
}

async function request(path, options = {}) {
  let response

  try {
    response = await fetch(`${ORDERS_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(getAdminToken() ? { Authorization: `Bearer ${getAdminToken()}` } : {}),
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

export async function getAdminOrders() {
  const payload = await request('/admin/all')
  if (!Array.isArray(payload?.data)) {
    throw new Error('Orders response mein order list nahi mili.')
  }
  return payload.data
}

export async function getAdminOrderItems(orderId) {
  const payload = await request(`/admin/${encodeURIComponent(orderId)}/items`)
  if (!Array.isArray(payload?.data)) {
    throw new Error('Order details response mein item list nahi mili.')
  }
  return payload.data
}

export function updateAdminOrderStatus(orderId, orderStatus) {
  return request(`/admin/${encodeURIComponent(orderId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ OrderStatus: orderStatus }),
  })
}
