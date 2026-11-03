const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const PRODUCTS_URL = `${API_BASE_URL.replace(/\/$/, '')}/products`
const PRODUCT_IMAGES_URL = `${API_BASE_URL.replace(/\/$/, '')}/product-images`

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

  try {
    response = await fetch(`${PRODUCTS_URL}${path}`, {
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

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed (${response.status}).`)
  }

  if (payload?.success === false) {
    throw new Error(payload.message || 'Request complete nahi ho saki.')
  }

  return payload
}

async function requestProductImage(path, options = {}) {
  let response

  try {
    response = await fetch(`${PRODUCT_IMAGES_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(getAdminToken() ? { Authorization: `Bearer ${getAdminToken()}` } : {}),
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

export async function getProducts() {
  const payload = await request()
  return Array.isArray(payload?.data) ? payload.data : []
}

export async function getProduct(id) {
  const payload = await request(`/${encodeURIComponent(id)}`)
  return payload?.data
}

export async function createProduct(product) {
  return request('', {
    method: 'POST',
    body: JSON.stringify(product),
  })
}

export async function updateProduct(id, product) {
  return request(`/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  })
}

export async function deleteProduct(id) {
  return request(`/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function setProductStatus(id, isActive) {
  return request(`/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ IsActive: isActive }),
  })
}

export async function getProductImages(productId) {
  const payload = await requestProductImage(`/${encodeURIComponent(productId)}`)
  return Array.isArray(payload?.data) ? payload.data : []
}

export async function addProductImage(productId, image) {
  return requestProductImage(`/${encodeURIComponent(productId)}`, {
    method: 'POST',
    body: image,
  })
}

export function getProductImageUrl(storageKey) {
  if (!storageKey) return ''
  if (/^(https?:\/\/|data:image\/)/i.test(storageKey)) return storageKey
  return new URL(storageKey.startsWith('/') ? storageKey : `/${storageKey}`, window.location.origin).href
}

export async function setPrimaryProductImage(productId, imageId) {
  return requestProductImage(`/${encodeURIComponent(productId)}/${encodeURIComponent(imageId)}/primary`, {
    method: 'PATCH',
  })
}

export async function updateProductImageOrder(productId, imageId, displayOrder) {
  return requestProductImage(`/${encodeURIComponent(productId)}/${encodeURIComponent(imageId)}/order`, {
    method: 'PATCH',
    body: JSON.stringify({ DisplayOrder: displayOrder }),
  })
}

export async function deleteProductImage(productId, imageId) {
  return requestProductImage(`/${encodeURIComponent(productId)}/${encodeURIComponent(imageId)}`, {
    method: 'DELETE',
  })
}
