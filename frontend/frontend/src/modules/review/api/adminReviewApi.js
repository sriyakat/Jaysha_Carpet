import { adminRequest, getAdminList } from '../../shared/api/adminRequest.js'

export async function getAdminReviews(filters = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== '') query.set(key, value)
  }
  const queryString = query.toString()
  const suffix = queryString ? `?${queryString}` : ''
  return getAdminList(await adminRequest(`/reviews/admin${suffix}`), 'Reviews')
}

export async function moderateReview(id, action) {
  return adminRequest(`/reviews/admin/${encodeURIComponent(id)}/${action}`, { method: 'PATCH' })
}

export async function deleteReview(id) {
  return adminRequest(`/reviews/admin/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
