import { adminRequest } from '../../shared/api/adminRequest.js'

export async function getPublicProductVideo(productId) {
  const payload = await adminRequest(`/product-videos/product/${encodeURIComponent(productId)}`)
  return payload?.data || null
}
