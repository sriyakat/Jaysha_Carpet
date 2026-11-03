import { adminRequest, getAdminList } from '../../shared/api/adminRequest.js'

function customerHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

export async function getMyNotifications(token) {
  return getAdminList(await adminRequest('/notifications/my', { headers: customerHeaders(token) }), 'Notifications')
}

export function markMyNotificationsRead(token) {
  return adminRequest('/notifications/my/read-all', { method: 'PATCH', headers: customerHeaders(token) })
}

export function markMyNotificationRead(token, id) {
  return adminRequest(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH', headers: customerHeaders(token) })
}
