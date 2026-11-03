import { adminRequest, getAdminList } from '../../shared/api/adminRequest.js'

export async function getAdminProductVideos(filters = {}) {
  const query = new URLSearchParams()
  if (filters.productId) query.set('productId', filters.productId)
  if (filters.isIllustrativePreview !== '') query.set('isIllustrativePreview', filters.isIllustrativePreview)
  const queryString = query.toString()
  const suffix = queryString ? `?${queryString}` : ''
  return getAdminList(await adminRequest(`/product-videos${suffix}`), 'Product videos')
}

export async function createProductVideo(data) {
  return adminRequest('/product-videos', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateProductVideo(id, data) {
  return adminRequest(`/product-videos/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function deleteProductVideo(id) {
  return adminRequest(`/product-videos/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
