import { useCallback, useEffect, useState } from 'react'
import AdminModuleLayout from '../../shared/components/AdminModuleLayout.jsx'
import '../shared/AdminModulePage.css'
import { deleteReview, getAdminReviews, moderateReview } from '../api/adminReviewApi.js'

function value(item, camel, pascal, fallback = '') {
  return item?.[camel] ?? item?.[pascal] ?? fallback
}

function isEnabled(valueToCheck) {
  return valueToCheck === true || valueToCheck === 1 || valueToCheck === '1' || valueToCheck === 'true'
}

function ReviewsPage({ user, onLogout, onNavigate }) {
  const [reviews, setReviews] = useState([])
  const [filters, setFilters] = useState({ productId: '', customerId: '', isApproved: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const items = await getAdminReviews(filters)
      setReviews(items)
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    let active = true
    getAdminReviews(filters)
      .then((items) => {
        if (active) {
          setReviews(items)
          setError('')
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [filters])

  async function action(review, actionName) {
    try {
      await moderateReview(value(review, 'reviewId', 'ReviewId'), actionName)
      await load()
    } catch (actionError) {
      setError(actionError.message)
    }
  }

  async function remove(review) {
    if (!window.confirm('Permanently delete this review?')) return
    try {
      await deleteReview(value(review, 'reviewId', 'ReviewId'))
      await load()
    } catch (actionError) {
      setError(actionError.message)
    }
  }

  return (
    <AdminModuleLayout activeModule="reviews" title="Reviews" user={user} onLogout={onLogout} onNavigate={onNavigate}>
      <section className="page-content module-page">
        <div className="module-heading"><div><p className="module-eyebrow">CUSTOMER FEEDBACK</p><h1>Reviews</h1><p>Approve reviews before publishing, hide them, or remove inappropriate content.</p></div></div>
        <div className="module-toolbar">
          <div className="module-toolbar-group">
            <input aria-label="Filter by product ID" className="module-input module-filter" min="1" onChange={(event) => setFilters({ ...filters, productId: event.target.value })} placeholder="Product ID" type="number" value={filters.productId} />
            <input aria-label="Filter by customer ID" className="module-input module-filter" min="1" onChange={(event) => setFilters({ ...filters, customerId: event.target.value })} placeholder="Customer ID" type="number" value={filters.customerId} />
            <select aria-label="Filter by approval status" className="module-select module-filter" onChange={(event) => setFilters({ ...filters, isApproved: event.target.value })} value={filters.isApproved}><option value="">All statuses</option><option value="0">Pending / hidden</option><option value="1">Approved</option></select>
          </div>
          <button className="module-button" onClick={load} type="button">Refresh</button>
        </div>
        <section className="module-panel">
          <div className="module-panel-heading"><h2>Customer reviews</h2><span>{reviews.length} reviews</span></div>
          {error && <div className="module-state error" role="alert">{error}</div>}
          {loading ? <div className="module-state">Loading reviews…</div> : reviews.length === 0 ? <div className="module-state">No reviews found for these filters.</div> : (
            <div className="module-table-wrap"><table className="module-table"><thead><tr><th>Product</th><th>Customer</th><th>Rating</th><th>Review</th><th>Status</th><th>Actions</th></tr></thead><tbody>
              {reviews.map((review) => {
                const id = value(review, 'reviewId', 'ReviewId')
                const approved = isEnabled(value(review, 'isApproved', 'IsApproved', false))
                return <tr key={id}><td><strong>{value(review, 'productName', 'ProductName', `Product ${value(review, 'productId', 'ProductId', '')}`)}</strong></td><td>{value(review, 'customerName', 'CustomerName', `Customer ${value(review, 'customerId', 'CustomerId', '')}`)}</td><td><strong>{'★'.repeat(Number(value(review, 'rating', 'Rating', 0)))} <span className="muted">/ 5</span></strong></td><td>{value(review, 'reviewText', 'ReviewText', '—')}</td><td>{approved ? 'Approved' : 'Pending / hidden'}</td><td><div className="module-row-actions">{!approved && <button className="module-button" onClick={() => action(review, 'approve')} type="button">Approve</button>}{approved && <button className="module-button" onClick={() => action(review, 'hide')} type="button">Hide</button>}<button className="module-button danger" onClick={() => remove(review)} type="button">Delete</button></div></td></tr>
              })}
            </tbody></table></div>
          )}
        </section>
      </section>
    </AdminModuleLayout>
  )
}

export default ReviewsPage
