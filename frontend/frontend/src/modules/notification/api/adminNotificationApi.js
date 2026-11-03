import { adminRequest, getAdminList } from '../../shared/api/adminRequest.js'

export async function getAdminNotifications(filters = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== '') query.set(key, value)
  }
  const queryString = query.toString()
  const suffix = queryString ? `?${queryString}` : ''
  return getAdminList(await adminRequest(`/notifications/admin/all${suffix}`), 'Notifications')
}

export async function createNotification(data) {
  return adminRequest('/notifications', { method: 'POST', body: JSON.stringify(data) })
}

export async function markNotificationSent(id) {
  return adminRequest(`/notifications/admin/${encodeURIComponent(id)}/sent`, { method: 'PATCH' })
}

export async function deleteNotification(id) {
  return adminRequest(`/notifications/admin/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
