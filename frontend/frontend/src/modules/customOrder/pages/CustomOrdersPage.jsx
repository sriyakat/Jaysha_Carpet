import { useEffect, useState } from 'react'
import Icon from '../../category/components/Icon.jsx'
import { getProductImageUrl } from '../../product/api/productApi.js'
import AdminModuleLayout from '../../shared/components/AdminModuleLayout.jsx'
import { getAdminCustomOrderRequests, updateCustomOrderRequestStatus } from '../api/customOrderApi.js'
import '../../shared/components/AdminModulePage.css'
import './CustomOrdersPage.css'

const STATUSES = ['NEW', 'CONTACTED', 'QUOTED', 'ACCEPTED', 'COMPLETED', 'CANCELLED']
const PAGE_SIZE = 20

function formatDate(dateValue) {
  if (!dateValue) return '—'
  const date = new Date(dateValue)
  return Number.isNaN(date.getTime())
    ? String(dateValue)
    : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function CustomOrdersPage({ user, onLogout, onNavigate }) {
  const [requests, setRequests] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 0 })
  const [selectedId, setSelectedId] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getAdminCustomOrderRequests({ page, pageSize: PAGE_SIZE, search: searchTerm, status: statusFilter })
      .then((result) => {
        if (!active) return
        const lastPage = Math.max(1, result.pagination.totalPages)
        if (page > lastPage) {
          setPage(lastPage)
          return
        }
        setRequests(result.items)
        setPagination(result.pagination)
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [page, refreshKey, searchTerm, statusFilter])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1)
      setSearchTerm(search.trim())
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [search])

  const selectedRequest = requests.find((request) => request.id === selectedId) || null

  function loadRequests() {
    setRefreshKey((current) => current + 1)
  }

  async function changeStatus(request, status) {
    if (status === request.status) return
    setUpdatingId(request.id)
    setError('')
    try {
      const payload = await updateCustomOrderRequestStatus(request.id, status)
      const updatedRequest = payload?.data
      if (!updatedRequest) throw new Error('Updated custom order request data is missing.')
      setRequests((current) => current.map((item) => item.id === request.id ? updatedRequest : item))
    } catch (updateError) {
      setError(updateError.message)
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <AdminModuleLayout activeModule="custom-orders" title="Custom carpet requests" user={user} onLogout={onLogout} onNavigate={onNavigate}>
      <section className="page-content module-page">
        <div className="module-heading">
          <div>
            <p className="module-eyebrow">CUSTOMER REQUESTS</p>
            <h1>Custom carpet requests</h1>
            <p>Review each customer’s measurements, colour choices and reference image.</p>
          </div>
          <button className="module-button" disabled={loading} onClick={loadRequests} type="button">Refresh requests</button>
        </div>

        {error && <p className="module-alert" role="alert">{error}</p>}

        <section className="module-panel">
          <div className="module-panel-heading custom-orders-toolbar">
            <div><h2>All requests</h2><span>{requests.length} shown · {pagination.total} total</span></div>
            <div className="custom-orders-filters">
              <input aria-label="Search custom requests" className="module-input" onChange={(event) => setSearch(event.target.value)} placeholder="Search customer..." type="search" value={search} />
              <select aria-label="Filter custom requests by status" className="module-select" onChange={(event) => { setPage(1); setStatusFilter(event.target.value) }} value={statusFilter}>
                <option value="">All statuses</option>
                {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
          </div>

          {loading
            ? <p className="custom-orders-empty" role="status">Loading requests...</p>
            : requests.length
              ? <div className="module-table-wrap">
                <table className="module-table">
                  <thead><tr><th>Customer</th><th>Custom size</th><th>Colour</th><th>Date</th><th>Status</th><th>Record</th></tr></thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr key={request.id}>
                        <td><strong>{request.customerName}</strong><small className="custom-orders-contact">{request.mobileNumber}<br />{request.email}</small></td>
                        <td>{request.width} × {request.length} {request.sizeUnit}</td>
                        <td><span className="custom-orders-colour"><i style={{ backgroundColor: request.colorHex }} />{request.colorName}</span></td>
                        <td>{formatDate(request.createdAt)}</td>
                        <td>
                          <select aria-label={`Update status for ${request.customerName}`} className="module-select custom-orders-status" disabled={updatingId === request.id} onChange={(event) => changeStatus(request, event.target.value)} value={request.status}>
                            {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                        </td>
                        <td><button className="module-button" onClick={() => setSelectedId(request.id)} type="button">View details</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              : <p className="custom-orders-empty">{pagination.total ? 'No requests match the current filters.' : 'No custom carpet requests have been submitted yet.'}</p>}
          {pagination.totalPages > 1 && <div className="custom-orders-pagination">
            <button className="module-button" disabled={loading || page <= 1} onClick={() => setPage((current) => current - 1)} type="button">Previous</button>
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <button className="module-button" disabled={loading || page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} type="button">Next</button>
          </div>}
        </section>

        {selectedRequest && <section aria-labelledby="custom-order-details-title" className="module-panel custom-order-detail-panel">
          <div className="module-panel-heading">
            <div><h2 id="custom-order-details-title">Request details</h2><span>Submitted {formatDate(selectedRequest.createdAt)}</span></div>
            <button aria-label="Close request details" className="module-button" onClick={() => setSelectedId('')} type="button"><Icon name="close" size={16} /></button>
          </div>
          <div className="custom-order-detail-content">
            <div className="custom-order-reference">
              <a href={getProductImageUrl(selectedRequest.imageUrl)} rel="noreferrer" target="_blank">
                <img alt={`Carpet reference from ${selectedRequest.customerName}`} src={getProductImageUrl(selectedRequest.imageUrl)} />
              </a>
              <span>Customer reference image · open image in a new tab to view full size</span>
            </div>
            <dl className="custom-order-details-list">
              <div><dt>Customer</dt><dd>{selectedRequest.customerName}</dd></div>
              <div><dt>Email</dt><dd><a href={`mailto:${selectedRequest.email}`}>{selectedRequest.email}</a></dd></div>
              <div><dt>Mobile</dt><dd><a href={`tel:${selectedRequest.mobileNumber}`}>{selectedRequest.mobileNumber}</a></dd></div>
              <div><dt>Custom size</dt><dd>{selectedRequest.width} × {selectedRequest.length} {selectedRequest.sizeUnit}</dd></div>
              <div><dt>Preferred colour</dt><dd><span className="custom-orders-colour"><i style={{ backgroundColor: selectedRequest.colorHex }} />{selectedRequest.colorName} ({selectedRequest.colorHex})</span></dd></div>
              <div><dt>Status</dt><dd>{selectedRequest.status}</dd></div>
              <div className="custom-order-notes"><dt>Additional instructions</dt><dd>{selectedRequest.notes || 'No additional instructions provided.'}</dd></div>
              <div><dt>Customer account ID</dt><dd>{selectedRequest.customerId}</dd></div>
              <div><dt>Request ID</dt><dd>{selectedRequest.id}</dd></div>
              <div><dt>Last updated</dt><dd>{formatDate(selectedRequest.updatedAt)}</dd></div>
            </dl>
          </div>
        </section>}
      </section>
    </AdminModuleLayout>
  )
}

export default CustomOrdersPage
