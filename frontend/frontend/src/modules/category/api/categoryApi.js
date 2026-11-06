import { adminRequest, getAdminList } from '../../shared/api/adminRequest.js'

export async function getCategories() {
  return getAdminList(await adminRequest('/categories'), 'Categories')
}

export function createCategory(category) {
  return adminRequest('/categories', {
    method: 'POST',
    body: category instanceof FormData ? category : JSON.stringify(category),
  })
}

export function updateCategory(id, category) {
  return adminRequest(`/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: category instanceof FormData ? category : JSON.stringify(category),
  })
}

export function deleteCategory(id) {
  return adminRequest(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
