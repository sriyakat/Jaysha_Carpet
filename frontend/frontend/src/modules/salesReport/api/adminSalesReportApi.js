import { adminRequest, getAdminList } from '../../shared/api/adminRequest.js'

function queryString(filters = {}) {
  const query = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) query.set(key, value)
  })
  const value = query.toString()
  return value ? `?${value}` : ''
}

export async function getReportSummary(filters) {
  const payload = await adminRequest(`/sales-reports/summary${queryString(filters)}`)
  if (!payload?.data || typeof payload.data !== 'object') throw new Error('Report summary response mein data nahi mila.')
  return payload.data
}

export async function getRevenueTrend(filters) {
  return getAdminList(await adminRequest(`/sales-reports/revenue-trend${queryString(filters)}`), 'Revenue trend')
}

export async function getBestSellingProducts(filters) {
  return getAdminList(await adminRequest(`/sales-reports/best-selling${queryString({ ...filters, topCount: 10 })}`), 'Best-selling products')
}

export async function getLowStockProducts(threshold = '') {
  return getAdminList(await adminRequest(`/sales-reports/low-stock${queryString({ threshold })}`), 'Low stock products')
}

export async function getPendingReportOrders(filters) {
  return getAdminList(await adminRequest(`/sales-reports/pending-orders${queryString(filters)}`), 'Pending orders')
}

export async function getRecentReportOrders() {
  return getAdminList(await adminRequest('/sales-reports/recent-orders?topCount=10'), 'Recent orders')
}

export function updateLowStockThreshold(lowStockThreshold) {
  return adminRequest('/sales-reports/settings', {
    method: 'PUT',
    body: JSON.stringify({ lowStockThreshold: Number(lowStockThreshold) }),
  })
}
