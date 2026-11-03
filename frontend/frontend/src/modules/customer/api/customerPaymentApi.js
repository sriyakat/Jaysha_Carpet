const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const API_URL = API_BASE_URL.replace(/\/$/, '')

async function request(path, token, options = {}) {
  let response

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${token}`,
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

export async function getRazorpayConfig(token) {
  const payload = await request('/customer-payments/razorpay/config', token)
  return payload.data
}

export async function createRazorpayOrder(token, orderId) {
  const payload = await request(
    `/customer-payments/razorpay/orders/${encodeURIComponent(orderId)}`,
    token,
    { method: 'POST' },
  )
  return payload.data
}

export async function verifyRazorpayPayment(token, orderId, details) {
  const payload = await request(
    `/customer-payments/razorpay/orders/${encodeURIComponent(orderId)}/verify`,
    token,
    {
      method: 'POST',
      body: JSON.stringify(details),
    },
  )
  return payload.data
}
