import { adminRequest, getAdminList } from '../../shared/api/adminRequest.js'

export async function getCoupons() {
  return getAdminList(await adminRequest('/coupons/admin/all'), 'Coupons')
}

export async function getCouponUsage(id) {
  return getAdminList(await adminRequest(`/coupons/admin/${encodeURIComponent(id)}/usage`), 'Coupon usage')
}

export function createCoupon(data) {
  return adminRequest('/coupons', { method: 'POST', body: JSON.stringify(data) })
}

export function updateCoupon(id, data) {
  return adminRequest(`/coupons/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function setCouponActive(id, active) {
  return adminRequest(`/coupons/${encodeURIComponent(id)}/${active ? 'activate' : 'deactivate'}`, { method: 'PATCH' })
}

export function deleteCoupon(id) {
  return adminRequest(`/coupons/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function getActiveCoupons() {
  return adminRequest('/coupons/active')
}

export function validateCustomerCoupon(token, couponCode, orderAmount) {
  return adminRequest('/coupons/validate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ couponCode, orderAmount }),
  })
}

export function applyCustomerCoupon(token, couponCode, orderId) {
  return adminRequest('/coupons/apply', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ couponCode, orderId }),
  })
}
