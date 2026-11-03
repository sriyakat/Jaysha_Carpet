import { getProducts } from '../../product/api/productApi.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const INVENTORY_URL = `${API_BASE_URL.replace(/\/$/, '')}/inventory`

function getAdminToken() {
  try {
    const session = JSON.parse(sessionStorage.getItem('admin-session') || 'null')
    return typeof session?.token === 'string' ? session.token : ''
  } catch {
    sessionStorage.removeItem('admin-session')
    return ''
  }
}

async function request(path = '', options = {}) {
  let response
  const token = getAdminToken()

  try {
    response = await fetch(`${INVENTORY_URL}${path}`, {
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

export async function getInventoryTransactions() {
  const payload = await request()
  if (!Array.isArray(payload?.data)) {
    throw new Error('Inventory response mein transaction list nahi mili.')
  }
  return payload.data
}

export async function getInventoryProducts() {
  return getProducts()
}

export function createInventoryTransaction(type, transaction) {
  const paths = {
    STOCK_IN: '/stock-in',
    STOCK_OUT: '/stock-out',
    ADJUSTMENT: '/adjustment',
  }
  const path = paths[type]
  if (!path) throw new Error('Invalid inventory action.')
  return request(path, {
    method: 'POST',
    body: JSON.stringify(transaction),
  })
}
