import { adminRequest, getAdminList } from '../../shared/api/adminRequest.js'

export async function getAdminCustomers() {
  return getAdminList(await adminRequest('/customers/admin/all'), 'Customers')
}

export async function getAdminCustomer(id) {
  const payload = await adminRequest(`/customers/admin/${encodeURIComponent(id)}`)
  if (!payload?.data || typeof payload.data !== 'object') throw new Error('Customer detail response mein data nahi mila.')
  return payload.data
}
