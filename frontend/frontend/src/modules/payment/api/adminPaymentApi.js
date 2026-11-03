const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const PAYMENTS_URL = `${API_BASE_URL.replace(/\/$/, '')}/payments`
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

async function request(baseUrl, path = '', options = {}) {
  let response
  const token = getAdminToken()

  try {
    response = await fetch(`${baseUrl}${path}`, {
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
    throw new Error(payload?.message || `Request failed (${response.status}).`)
  }
  return payload
}

export async function getAdminPayments() {
  const payload = await request(PAYMENTS_URL)
  if (!Array.isArray(payload?.data)) {
    throw new Error('Payments response mein payment list nahi mili.')
  }
  return payload.data
}

export async function getOrdersForPayments() {
  const payload = await request(ORDERS_URL, '/admin/all')
  if (!Array.isArray(payload?.data)) {
    throw new Error('Orders response mein order list nahi mili.')
  }
  return payload.data
}

export function createAdminPayment(payment) {
  return request(PAYMENTS_URL, '', {
    method: 'POST',
    body: JSON.stringify(payment),
  })
}

export function updateAdminPaymentStatus(paymentId, paymentStatus) {
  return request(PAYMENTS_URL, `/${encodeURIComponent(paymentId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ PaymentStatus: paymentStatus }),
  })
}

export function updateAdminPaymentGateway(paymentId, gateway) {
  return request(PAYMENTS_URL, `/${encodeURIComponent(paymentId)}/gateway`, {
    method: 'PATCH',
    body: JSON.stringify(gateway),
  })
}
