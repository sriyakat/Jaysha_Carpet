import { adminRequest } from './adminRequest.js'

export async function getContentImageMap(resource) {
  const payload = await adminRequest(`/content-images/${encodeURIComponent(resource)}`)
  if (!payload?.data || typeof payload.data !== 'object') {
    throw new Error('Image list response mein data nahi mila.')
  }
  return payload.data
}

export function uploadContentImage(resource, id, file) {
  const data = new FormData()
  data.append('image', file)
  return adminRequest(`/content-images/${encodeURIComponent(resource)}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: data,
  })
}

export function deleteContentImage(resource, id) {
  return adminRequest(`/content-images/${encodeURIComponent(resource)}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
