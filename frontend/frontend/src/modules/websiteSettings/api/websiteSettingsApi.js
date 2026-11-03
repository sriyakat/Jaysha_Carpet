import { adminRequest } from '../../shared/api/adminRequest.js'

export async function getWebsiteSettings() {
  const payload = await adminRequest('/website-settings')
  if (!payload?.data || typeof payload.data !== 'object') {
    throw new Error('Website settings response mein data nahi mila.')
  }
  return payload.data
}

export async function updateWebsiteSettings(settings) {
  return adminRequest('/website-settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}
