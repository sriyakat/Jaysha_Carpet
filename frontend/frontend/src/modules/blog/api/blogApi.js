import { adminRequest } from '../../shared/api/adminRequest.js'

export async function getBlogPosts({ admin = false, page = 1, pageSize = 20 } = {}) {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  const payload = await adminRequest(`/blog-posts${admin ? '/admin' : ''}?${query}`)
  if (!Array.isArray(payload?.data) || !payload?.pagination) {
    throw new Error('Blog posts response mein paginated list nahi mili.')
  }
  return { items: payload.data, pagination: payload.pagination }
}

function createFormData(post, mediaFile) {
  const data = new FormData()
  Object.entries(post).forEach(([key, value]) => data.append(key, String(value)))
  if (mediaFile) data.append('media', mediaFile)
  return data
}

export function createBlogPost(post, mediaFile) {
  return adminRequest('/blog-posts', {
    method: 'POST',
    body: createFormData(post, mediaFile),
  })
}

export function updateBlogPost(id, post, mediaFile) {
  return adminRequest(`/blog-posts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: createFormData(post, mediaFile),
  })
}

export function deleteBlogPost(id) {
  return adminRequest(`/blog-posts/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
