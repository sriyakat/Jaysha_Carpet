import { adminRequest, getAdminList } from '../../shared/api/adminRequest.js'

export async function getAdminVariants(filters = {}) {
  const query = new URLSearchParams()
  if (filters.productId) query.set('productId', filters.productId)
  if (filters.isActive !== '') query.set('isActive', filters.isActive)
  const queryString = query.toString()
  const suffix = queryString ? `?${queryString}` : ''
  return getAdminList(await adminRequest(`/product-variants${suffix}`), 'Product variants')
}

export async function createVariant(data) {
  return adminRequest('/product-variants', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateVariant(id, data) {
  return adminRequest(`/product-variants/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function setVariantActive(id, active) {
  const action = active ? 'activate' : 'deactivate'
  return adminRequest(`/product-variants/${encodeURIComponent(id)}/${action}`, { method: 'PATCH' })
}
