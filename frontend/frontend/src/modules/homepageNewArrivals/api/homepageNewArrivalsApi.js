import { adminRequest } from '../../shared/api/adminRequest.js'

export async function getHomepageNewArrivalProductIds() {
  const payload = await adminRequest('/homepage-new-arrivals')
  if (!Array.isArray(payload?.data) || payload.data.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    throw new Error('Homepage new arrivals response mein product IDs ki list nahi mili.')
  }
  return payload.data
}

export async function saveHomepageNewArrivalProductIds(productIds) {
  return adminRequest('/homepage-new-arrivals', {
    method: 'PUT',
    body: JSON.stringify({ productIds }),
  })
}
