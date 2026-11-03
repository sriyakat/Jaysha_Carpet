import { adminRequest, getAdminList } from '../../shared/api/adminRequest.js'

export async function getAdminReturnRequests(filters = {}) {
  const query = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '') query.set(key, value)
  })
  const queryString = query.toString()
  return getAdminList(await adminRequest(`/return-requests/admin/all${queryString ? `?${queryString}` : ''}`), 'Return requests')
}

export function updateReturnRequestStatus(id, data) {
  return adminRequest(`/return-requests/admin/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function updateReturnRefund(id, data) {
  return adminRequest(`/return-requests/admin/${encodeURIComponent(id)}/refund`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteReturnRequest(id) {
  return adminRequest(`/return-requests/admin/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

async function customerRequest(path, token, options = {}) {
  const payload = await adminRequest(path, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  })
  return payload
}

export async function getCustomerReturnRequests(token) {
  return getAdminList(await customerRequest('/return-requests/my', token), 'Your requests')
}

export function createCustomerReturnRequest(token, data) {
  return customerRequest('/return-requests', token, { method: 'POST', body: JSON.stringify(data) })
}

export function getCustomerReturnRequest(token, id) {
  return customerRequest(`/return-requests/my/${encodeURIComponent(id)}`, token)
}
