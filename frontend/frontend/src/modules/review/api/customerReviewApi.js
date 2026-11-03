import { adminRequest, getAdminList } from '../../shared/api/adminRequest.js'

function customerHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

export async function getMyReviews(token) {
  return getAdminList(await adminRequest('/reviews/my', { headers: customerHeaders(token) }), 'Your reviews')
}

export async function getPublicProductReviews(productId) {
  return getAdminList(await adminRequest(`/reviews/product/${encodeURIComponent(productId)}`), 'Product reviews')
}

export function createCustomerReview(token, review) {
  return adminRequest('/reviews', { method: 'POST', headers: customerHeaders(token), body: JSON.stringify(review) })
}

export function updateCustomerReview(token, id, review) {
  return adminRequest(`/reviews/${encodeURIComponent(id)}`, { method: 'PUT', headers: customerHeaders(token), body: JSON.stringify(review) })
}

export function deleteCustomerReview(token, id) {
  return adminRequest(`/reviews/${encodeURIComponent(id)}`, { method: 'DELETE', headers: customerHeaders(token) })
}
