import { adminRequest, getAdminList } from '../../shared/api/adminRequest.js'

export async function getActiveHomepageBanners() {
  return getAdminList(await adminRequest('/homepage-banners/active'), 'Active homepage banners')
}

export async function getHomepageBanners(filters = {}) {
  const query = filters.isActive === '' ? '' : `?isActive=${encodeURIComponent(filters.isActive)}`
  return getAdminList(await adminRequest(`/homepage-banners/admin/all${query}`), 'Homepage banners')
}

export function createHomepageBanner(data) {
  return adminRequest('/homepage-banners', {
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data),
  })
}

export function updateHomepageBanner(id, data) {
  return adminRequest(`/homepage-banners/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: data instanceof FormData ? data : JSON.stringify(data),
  })
}

export function setHomepageBannerActive(id, active) {
  return adminRequest(`/homepage-banners/${encodeURIComponent(id)}/${active ? 'activate' : 'deactivate'}`, { method: 'PATCH' })
}

export function deleteHomepageBanner(id) {
  return adminRequest(`/homepage-banners/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
