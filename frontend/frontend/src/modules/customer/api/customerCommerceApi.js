const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const API_URL = API_BASE_URL.replace(/\/$/, '')

async function request(path, { token, ...options } = {}) {
  let response

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
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

export async function getCustomerAddresses(token) {
  const payload = await request('/customer-addresses', { token })
  if (!Array.isArray(payload?.data)) {
    throw new Error('Address response mein address list nahi mili.')
  }
  return payload.data
}

export function createCustomerAddress(token, address) {
  return request('/customer-addresses', {
    token,
    method: 'POST',
    body: JSON.stringify(address),
  })
}

export function updateCustomerAddress(token, addressId, address) {
  return request(`/customer-addresses/${encodeURIComponent(addressId)}`, {
    token,
    method: 'PUT',
    body: JSON.stringify(address),
  })
}

export function deleteCustomerAddress(token, addressId) {
  return request(`/customer-addresses/${encodeURIComponent(addressId)}`, {
    token,
    method: 'DELETE',
  })
}

export function setDefaultCustomerAddress(token, addressId) {
  return request(`/customer-addresses/${encodeURIComponent(addressId)}/default`, {
    token,
    method: 'PATCH',
  })
}

export async function getCustomerOrders(token) {
  const payload = await request('/orders', { token })
  if (!Array.isArray(payload?.data)) {
    throw new Error('Order response mein order list nahi mili.')
  }
  return payload.data
}

export function getCustomerOrder(token, orderId) {
  return request(`/orders/${encodeURIComponent(orderId)}`, { token })
}

export function cancelCustomerOrder(token, orderId) {
  return request(`/orders/${encodeURIComponent(orderId)}/cancel`, {
    token,
    method: 'PATCH',
  })
}

export function createCustomerOrder(token, order) {
  return request('/orders', {
    token,
    method: 'POST',
    body: JSON.stringify(order),
  })
}
