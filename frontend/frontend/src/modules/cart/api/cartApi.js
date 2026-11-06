const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const API_URL = API_BASE_URL.replace(/\/$/, '')
const CART_STORAGE_KEY = 'jaysha-customer-cart'
const LEGACY_GUEST_CART_STORAGE_KEY = 'jaysha-guest-cart'

async function request(path, options = {}) {
  let response

  try {
    response = await fetch(`${API_URL}${path}`, {
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

  if (!response.ok || payload?.success === false) {
    const error = new Error(payload?.message || `Request failed (${response.status}).`)
    error.status = response.status
    throw error
  }

  return payload
}

export async function getShopProducts() {
  const payload = await request('/products')
  return Array.isArray(payload?.data) ? payload.data : []
}

export async function getShopCategories() {
  const payload = await request('/categories')
  return Array.isArray(payload?.data) ? payload.data : []
}

export async function getPublicProductVariants(productId) {
  const payload = await request(`/product-variants/product/${encodeURIComponent(productId)}`)
  return Array.isArray(payload?.data) ? payload.data : []
}

function readCartId(data) {
  return data?.CartId ?? data?.cartId ?? data?.Id ?? data?.id
}

export function readSavedCart(customerId) {
  try {
    localStorage.removeItem(LEGACY_GUEST_CART_STORAGE_KEY)
    const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || 'null')
    if (
      Number.isInteger(Number(saved?.cartId))
      && Number(saved.cartId) > 0
      && customerId
      && saved?.customerId === customerId
    ) {
      return { cartId: Number(saved.cartId), customerId }
    }
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY)
  }

  return null
}

export function clearSavedCart() {
  localStorage.removeItem(CART_STORAGE_KEY)
  localStorage.removeItem(LEGACY_GUEST_CART_STORAGE_KEY)
}

export async function createCustomerCart(token) {
  const payload = await request('/cart/create', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const cartId = readCartId(payload?.data)

  if (!Number.isInteger(Number(cartId)) || Number(cartId) <= 0) {
    throw new Error('Backend ne customer cart ID nahi diya. Cart response check karein.')
  }

  return Number(cartId)
}

export function saveCustomerCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
}

export async function getCustomerCart(token, cartId) {
  return request(`/cart/${encodeURIComponent(cartId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function addItemToCustomerCart(token, cartId, productId, quantity = 1) {
  return request(`/cart/${encodeURIComponent(cartId)}/items`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      ProductId: productId,
      Quantity: quantity,
    }),
  })
}

export async function updateCustomerCartItem(token, cartId, cartItemId, quantity) {
  return request(`/cart/${encodeURIComponent(cartId)}/items/${encodeURIComponent(cartItemId)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ Quantity: quantity }),
  })
}

export async function removeCustomerCartItem(token, cartId, cartItemId) {
  return request(`/cart/${encodeURIComponent(cartId)}/items/${encodeURIComponent(cartItemId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function clearCustomerCart(token, cartId) {
  return request(`/cart/${encodeURIComponent(cartId)}/items`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}
