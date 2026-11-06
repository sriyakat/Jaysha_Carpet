import { adminRequest, getAdminList } from '../../shared/api/adminRequest.js'

function getResourcePath(section) {
  if (section === 'offer') return '/homepage-offer'
  return section === 'inspiration' ? '/homepage-inspiration' : '/homepage-showcase'
}

export async function getHomepageShowcaseItems({ admin = false, section = 'showcase' } = {}) {
  const payload = await adminRequest(`${getResourcePath(section)}${admin ? '/admin' : ''}`)
  const resourceName = section === 'offer' ? 'Homepage offer' : section === 'inspiration' ? 'Homepage inspiration' : 'Homepage showcase'
  return getAdminList(payload, resourceName)
}

function createFormData(item, mediaFile) {
  const data = new FormData()
  Object.entries(item).forEach(([key, value]) => data.append(key, String(value)))
  if (mediaFile) data.append('media', mediaFile)
  return data
}

export function createHomepageShowcaseItem(item, mediaFile, section = 'showcase') {
  return adminRequest(getResourcePath(section), {
    method: 'POST',
    body: createFormData(item, mediaFile),
  })
}

export function updateHomepageShowcaseItem(id, item, mediaFile, section = 'showcase') {
  return adminRequest(`${getResourcePath(section)}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: createFormData(item, mediaFile),
  })
}

export function deleteHomepageShowcaseItem(id, section = 'showcase') {
  return adminRequest(`${getResourcePath(section)}/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
