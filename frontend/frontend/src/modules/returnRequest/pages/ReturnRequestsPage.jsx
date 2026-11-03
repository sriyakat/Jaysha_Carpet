import { useCallback, useEffect, useState } from 'react'
import AdminModuleLayout from '../../shared/components/AdminModuleLayout.jsx'
import '../shared/AdminModulePage.css'
import { deleteReturnRequest, getAdminReturnRequests, updateReturnRefund, updateReturnRequestStatus } from '../api/returnRequestApi.js'

function value(item, camel, pascal, fallback = '') {
  return item?.[camel] ?? item?.[pascal] ?? fallback
}

function ReturnRequestsPage({ user, onLogout, onNavigate }) {
  const [requests, setRequests] = useState([])
  const [filters, setFilters] = useState({ requestStatus: '', requestType: '', refundStatus: '' })
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ AdminNotes: '', RefundStatus: 'PENDING', RefundAmount: '', RefundMethod: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setRequests(await getAdminReturnRequests(filters))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    let active = true
    getAdminReturnRequests(filters).then((items) => {
      if (active) setRequests(items)
    }).catch((loadError) => {
      if (active) setError(loadError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [filters])

  function editRequest(request) {
    setEditing(request)
    setForm({
      AdminNotes: value(request, 'adminNotes', 'AdminNotes'),
      RefundStatus: value(request, 'refundStatus', 'RefundStatus', 'PENDING'),
      RefundAmount: String(value(request, 'refundAmount', 'RefundAmount', '')),
      RefundMethod: value(request, 'refundMethod', 'RefundMethod'),
    })
    setFormError('')
  }

  async function setStatus(request, RequestStatus) {
    const id = value(request, 'returnRequestId', 'ReturnRequestId')
    try {
      await updateReturnRequestStatus(id, { RequestStatus, AdminNotes: form.AdminNotes || null })
      await load()
    } catch (actionError) {
      setError(actionError.message)
    }
  }

  async function saveRefund(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await updateReturnRefund(value(editing, 'returnRequestId', 'ReturnRequestId'), {
        RefundStatus: form.RefundStatus,
        RefundAmount: form.RefundAmount === '' ? null : Number(form.RefundAmount),
        RefundMethod: form.RefundMethod || null,
        AdminNotes: form.AdminNotes || null,
      })
      setEditing(null)
      await load()
    } catch (saveError) {
      setFormError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(request) {
    if (!window.confirm('Delete this return/cancellation request?')) return
    try {
      await deleteReturnRequest(value(request, 'returnRequestId', 'ReturnRequestId'))
      await load()
    } catch (actionError) {
      setError(actionError.message)
    }
  }

  return (
    <AdminModuleLayout activeModule="returns" title="Returns & refunds" user={user} onLogout={onLogout} onNavigate={onNavigate}>
      <section className="page-content module-page">
        <div className="module-heading"><div><p className="module-eyebrow">AFTER-SALES</p><h1>Returns & cancellations</h1><p>Review customer requests, make decisions, and track refunds.</p></div></div>
        <div className="module-toolbar"><div className="module-toolbar-group">
          <select aria-label="Filter by request status" className="module-select module-filter" onChange={(event) => setFilters({ ...filters, requestStatus: event.target.value })} value={filters.requestStatus}><option value="">All request statuses</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option></select>
          <select aria-label="Filter by request type" className="module-select module-filter" onChange={(event) => setFilters({ ...filters, requestType: event.target.value })} value={filters.requestType}><option value="">All request types</option><option value="RETURN">Return</option><option value="CANCELLATION">Cancellation</option></select>
          <select aria-label="Filter by refund status" className="module-select module-filter" onChange={(event) => setFilters({ ...filters, refundStatus: event.target.value })} value={filters.refundStatus}><option value="">All refund statuses</option><option value="PENDING">Pending</option><option value="PROCESSING">Processing</option><option value="COMPLETED">Completed</option><option value="FAILED">Failed</option></select>
        </div><button className="module-button" onClick={load} type="button">Refresh</button></div>
        <section className="module-panel"><div className="module-panel-heading"><h2>Customer requests</h2><span>{requests.length} requests</span></div>
          {error && <div className="module-state error" role="alert">{error}</div>}
          {loading ? <div className="module-state">Loading requests…</div> : requests.length === 0 ? <div className="module-state">No return or cancellation requests found.</div> : <div className="module-table-wrap"><table className="module-table"><thead><tr><th>Request / order</th><th>Customer</th><th>Reason</th><th>Status</th><th>Refund</th><th>Actions</th></tr></thead><tbody>
            {requests.map((request) => {
              const id = value(request, 'returnRequestId', 'ReturnRequestId')
              const status = String(value(request, 'requestStatus', 'RequestStatus', 'PENDING')).toUpperCase()
              return <tr key={id}><td><strong>#{id} · {value(request, 'requestType', 'RequestType')}</strong><span className="muted">Order {value(request, 'orderNumber', 'OrderNumber', value(request, 'orderId', 'OrderId'))}</span></td><td><strong>{value(request, 'customerName', 'CustomerName', 'Customer')}</strong><span className="muted">{value(request, 'customerEmail', 'CustomerEmail')}</span></td><td><strong>{value(request, 'reason', 'Reason')}</strong><span className="muted">{value(request, 'description', 'Description')}</span></td><td>{status}</td><td><strong>{value(request, 'refundStatus', 'RefundStatus', 'PENDING')}</strong><span className="muted">{value(request, 'refundAmount', 'RefundAmount') ? `₹${value(request, 'refundAmount', 'RefundAmount')}` : 'Amount not set'}</span></td><td><div className="module-row-actions">{status === 'PENDING' && <><button className="module-button" onClick={() => setStatus(request, 'APPROVED')} type="button">Approve</button><button className="module-button danger" onClick={() => setStatus(request, 'REJECTED')} type="button">Reject</button></>}<button className="module-button" onClick={() => editRequest(request)} type="button">Refund / notes</button><button className="module-button danger" onClick={() => remove(request)} type="button">Delete</button></div></td></tr>
            })}
          </tbody></table></div>}
        </section>
        {editing && <div className="module-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setEditing(null) }}><section aria-labelledby="refund-title" aria-modal="true" className="module-modal" role="dialog"><div className="module-panel-heading"><h2 id="refund-title">Request #{value(editing, 'returnRequestId', 'ReturnRequestId')}</h2><button className="module-button" onClick={() => setEditing(null)} type="button">Close</button></div><div className="module-form-panel">{formError && <p className="module-alert" role="alert">{formError}</p>}<form className="module-form" onSubmit={saveRefund}>
          <label className="module-field">Refund status<select className="module-select" onChange={(event) => setForm({ ...form, RefundStatus: event.target.value })} value={form.RefundStatus}><option value="PENDING">Pending</option><option value="PROCESSING">Processing</option><option value="COMPLETED">Completed</option><option value="FAILED">Failed</option></select></label>
          <label className="module-field">Refund amount (₹)<input className="module-input" min="0" onChange={(event) => setForm({ ...form, RefundAmount: event.target.value })} step="0.01" type="number" value={form.RefundAmount} /></label>
          <label className="module-field">Refund method<input className="module-input" maxLength="30" onChange={(event) => setForm({ ...form, RefundMethod: event.target.value })} placeholder="Original payment method" value={form.RefundMethod} /></label>
          <label className="module-field wide">Admin notes<textarea className="module-textarea" maxLength="1000" onChange={(event) => setForm({ ...form, AdminNotes: event.target.value })} value={form.AdminNotes} /></label>
          <div className="module-form-actions"><button className="module-button" disabled={saving} onClick={() => setEditing(null)} type="button">Cancel</button><button className="module-button primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save refund details'}</button></div>
        </form></div></section></div>}
      </section>
    </AdminModuleLayout>
  )
}

export default ReturnRequestsPage
