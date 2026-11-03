import { useCallback, useEffect, useState } from 'react'
import {
  cancelCustomerOrder,
  createCustomerAddress,
  deleteCustomerAddress,
  getCustomerAddresses,
  getCustomerOrder,
  getCustomerOrders,
  setDefaultCustomerAddress,
  updateCustomerAddress,
} from '../api/customerCommerceApi.js'
import { createCustomerReturnRequest, getCustomerReturnRequests } from '../../returnRequest/api/returnRequestApi.js'
import { getMyNotifications, markMyNotificationRead, markMyNotificationsRead } from '../../notification/api/customerNotificationApi.js'
import { createCustomerReview, deleteCustomerReview, getMyReviews, updateCustomerReview } from '../../review/api/customerReviewApi.js'
import { getProducts } from '../../product/api/productApi.js'

const EMPTY_ADDRESS = {
  AddressLine: '',
  MobileNumber: '',
  Landmark: '',
  City: '',
  State: '',
  Country: 'India',
  Pincode: '',
  IsDefault: false,
}

function field(item, pascalName, camelName, fallback = '') {
  return item?.[pascalName] ?? item?.[camelName] ?? fallback
}

function formatDate(value) {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(date)
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function AddressBook({ token }) {
  const [addresses, setAddresses] = useState([])
  const [form, setForm] = useState(EMPTY_ADDRESS)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadAddresses = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setAddresses(await getCustomerAddresses(token))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    let active = true
    getCustomerAddresses(token)
      .then((items) => {
        if (active) setAddresses(items)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [token])

  function startEditing(address) {
    setEditingId(field(address, 'AddressId', 'addressId'))
    setForm({
      AddressLine: field(address, 'AddressLine', 'addressLine'),
      MobileNumber: field(address, 'MobileNumber', 'mobileNumber'),
      Landmark: field(address, 'Landmark', 'landmark'),
      City: field(address, 'City', 'city'),
      State: field(address, 'State', 'state'),
      Country: field(address, 'Country', 'country', 'India'),
      Pincode: field(address, 'Pincode', 'pincode'),
      IsDefault: Boolean(field(address, 'IsDefault', 'isDefault', false)),
    })
    setNotice('')
    setError('')
  }

  function resetForm() {
    setEditingId(null)
    setForm({ ...EMPTY_ADDRESS })
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      if (editingId) {
        await updateCustomerAddress(token, editingId, form)
        if (form.IsDefault) await setDefaultCustomerAddress(token, editingId)
        setNotice('Address update ho gaya.')
      } else {
        await createCustomerAddress(token, form)
        setNotice('Naya address save ho gaya.')
      }
      resetForm()
      await loadAddresses()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDefault(addressId) {
    setBusyId(addressId)
    setError('')
    setNotice('')
    try {
      await setDefaultCustomerAddress(token, addressId)
      setNotice('Default delivery address update ho gaya.')
      await loadAddresses()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(addressId) {
    if (!window.confirm('Kya aap is saved address ko delete karna chahte hain?')) return
    setBusyId(addressId)
    setError('')
    setNotice('')
    try {
      await deleteCustomerAddress(token, addressId)
      setNotice('Address delete ho gaya.')
      await loadAddresses()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="commerce-section">
      <div className="commerce-section-heading">
        <div>
          <h3>Saved addresses</h3>
          <p>Delivery ke liye apne ghar ya office ka address save karein.</p>
        </div>
        <span className="commerce-count">{addresses.length}</span>
      </div>

      {error && <p className="customer-message customer-message-error" role="alert">{error}</p>}
      {notice && <p className="customer-message customer-message-success" role="status">{notice}</p>}

      {loading ? (
        <p aria-live="polite" className="customer-loading">Addresses load ho rahe hain...</p>
      ) : addresses.length ? (
        <div className="commerce-address-list">
          {addresses.map((address, index) => {
            const addressId = field(address, 'AddressId', 'addressId')
            const isDefault = Boolean(field(address, 'IsDefault', 'isDefault', false))
            return (
              <article className="commerce-address-card" key={addressId ?? index}>
                <div className="commerce-card-topline">
                  <strong>{field(address, 'City', 'city', 'Saved address')}</strong>
                  {isDefault && <span className="commerce-badge">Default</span>}
                </div>
                <p>{field(address, 'AddressLine', 'addressLine')}</p>
                {field(address, 'Landmark', 'landmark') && <p>Near {field(address, 'Landmark', 'landmark')}</p>}
                <p>{field(address, 'City', 'city')}, {field(address, 'State', 'state')} {field(address, 'Pincode', 'pincode')}</p>
                <p>{field(address, 'Country', 'country')} · {field(address, 'MobileNumber', 'mobileNumber')}</p>
                <div className="commerce-card-actions">
                  <button disabled={busyId === addressId} onClick={() => startEditing(address)} type="button">Edit</button>
                  {!isDefault && (
                    <button disabled={busyId === addressId} onClick={() => handleDefault(addressId)} type="button">
                      {busyId === addressId ? 'Updating...' : 'Make default'}
                    </button>
                  )}
                  <button className="commerce-danger-action" disabled={busyId === addressId} onClick={() => handleDelete(addressId)} type="button">Delete</button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <p className="commerce-empty">Abhi koi saved address nahi hai. Neeche apna pehla address add karein.</p>
      )}

      <form className="commerce-address-form" onSubmit={handleSubmit}>
        <h3>{editingId ? 'Edit address' : 'Add a new address'}</h3>
        <div className="commerce-form-grid">
          <label className="customer-field commerce-field-wide" htmlFor="address-line">House no., street, area
            <input autoComplete="street-address" id="address-line" maxLength={300} onChange={(event) => setForm({ ...form, AddressLine: event.target.value })} required value={form.AddressLine} />
          </label>
          <label className="customer-field" htmlFor="address-mobile">Mobile number
            <input autoComplete="tel" id="address-mobile" inputMode="tel" maxLength={20} onChange={(event) => setForm({ ...form, MobileNumber: event.target.value })} required type="tel" value={form.MobileNumber} />
          </label>
          <label className="customer-field" htmlFor="address-landmark">Landmark <span>Optional</span>
            <input id="address-landmark" maxLength={150} onChange={(event) => setForm({ ...form, Landmark: event.target.value })} value={form.Landmark} />
          </label>
          <label className="customer-field" htmlFor="address-city">City
            <input autoComplete="address-level2" id="address-city" maxLength={100} onChange={(event) => setForm({ ...form, City: event.target.value })} required value={form.City} />
          </label>
          <label className="customer-field" htmlFor="address-state">State
            <input autoComplete="address-level1" id="address-state" maxLength={100} onChange={(event) => setForm({ ...form, State: event.target.value })} required value={form.State} />
          </label>
          <label className="customer-field" htmlFor="address-country">Country
            <input autoComplete="country-name" id="address-country" maxLength={100} onChange={(event) => setForm({ ...form, Country: event.target.value })} required value={form.Country} />
          </label>
          <label className="customer-field" htmlFor="address-pincode">PIN code
            <input autoComplete="postal-code" id="address-pincode" maxLength={15} onChange={(event) => setForm({ ...form, Pincode: event.target.value })} required value={form.Pincode} />
          </label>
        </div>
        <label className="commerce-checkbox" htmlFor="address-default">
          <input checked={form.IsDefault} id="address-default" onChange={(event) => setForm({ ...form, IsDefault: event.target.checked })} type="checkbox" />
          Save as my default delivery address
        </label>
        <div className="commerce-form-actions">
          <button className="customer-submit" disabled={saving} type="submit">{saving ? 'Saving...' : editingId ? 'Save address' : 'Add address'}</button>
          {editingId && <button className="commerce-cancel-edit" disabled={saving} onClick={resetForm} type="button">Cancel</button>}
        </div>
      </form>
    </div>
  )
}

function OrdersList({ token }) {
  const [orders, setOrders] = useState([])
  const [orderDetails, setOrderDetails] = useState({})
  const [expandedOrderId, setExpandedOrderId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busyOrderId, setBusyOrderId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setOrders(await getCustomerOrders(token))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    let active = true
    getCustomerOrders(token)
      .then((items) => {
        if (active) setOrders(items)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [token])

  async function toggleDetails(orderId) {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null)
      return
    }
    setExpandedOrderId(orderId)
    if (orderDetails[orderId]) return
    setBusyOrderId(orderId)
    setError('')
    try {
      const payload = await getCustomerOrder(token, orderId)
      setOrderDetails((current) => ({ ...current, [orderId]: payload?.data }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyOrderId(null)
    }
  }

  async function handleCancel(orderId) {
    if (!window.confirm('Kya aap is order ko cancel karna chahte hain?')) return
    setBusyOrderId(orderId)
    setError('')
    setNotice('')
    try {
      await cancelCustomerOrder(token, orderId)
      setNotice('Order cancel kar diya gaya.')
      setOrderDetails((current) => {
        const next = { ...current }
        delete next[orderId]
        return next
      })
      await loadOrders()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyOrderId(null)
    }
  }

  return (
    <div className="commerce-section">
      <div className="commerce-section-heading">
        <div>
          <h3>Your orders</h3>
          <p>Order status aur items yahan dekh sakte hain.</p>
        </div>
        <button className="commerce-refresh" disabled={loading} onClick={loadOrders} type="button">Refresh</button>
      </div>
      {error && <p className="customer-message customer-message-error" role="alert">{error}</p>}
      {notice && <p className="customer-message customer-message-success" role="status">{notice}</p>}
      {loading ? (
        <p aria-live="polite" className="customer-loading">Orders load ho rahe hain...</p>
      ) : orders.length ? (
        <div className="commerce-order-list">
          {orders.map((order, index) => {
            const orderId = field(order, 'OrderId', 'orderId')
            const orderNumber = field(order, 'OrderNumber', 'orderNumber', `#${orderId}`)
            const orderStatus = String(field(order, 'OrderStatus', 'orderStatus', 'PENDING'))
            const detail = orderDetails[orderId]
            const items = Array.isArray(detail?.items) ? detail.items : Array.isArray(detail?.Items) ? detail.Items : []
            return (
              <article className="commerce-order-card" key={orderId ?? index}>
                <div className="commerce-order-heading">
                  <div><span>Order</span><strong>{orderNumber}</strong></div>
                  <span className={`commerce-order-status status-${orderStatus.toLowerCase()}`}>{orderStatus.replaceAll('_', ' ')}</span>
                </div>
                <div className="commerce-order-meta">
                  <span>Placed {formatDate(field(order, 'CreatedAt', 'createdAt'))}</span>
                  <strong>{formatMoney(field(order, 'GrandTotal', 'grandTotal', field(order, 'TotalAmount', 'totalAmount', 0)))}</strong>
                </div>
                <div className="commerce-card-actions">
                  <button disabled={busyOrderId === orderId} onClick={() => toggleDetails(orderId)} type="button">
                    {busyOrderId === orderId ? 'Loading...' : expandedOrderId === orderId ? 'Hide details' : 'View details'}
                  </button>
                  {['PLACED', 'CONFIRMED'].includes(orderStatus.toUpperCase()) && (
                    <button className="commerce-danger-action" disabled={busyOrderId === orderId} onClick={() => handleCancel(orderId)} type="button">Cancel order</button>
                  )}
                </div>
                {expandedOrderId === orderId && detail && (
                  <div className="commerce-order-details">
                    <p>{field(detail.order, 'PaymentMethod', 'paymentMethod', field(order, 'PaymentMethod', 'paymentMethod', 'COD'))} · Payment {field(detail.order, 'PaymentStatus', 'paymentStatus', field(order, 'PaymentStatus', 'paymentStatus', 'PENDING'))}</p>
                    {field(detail.order, 'TrackingNumber', 'trackingNumber') && <p>Tracking: {field(detail.order, 'TrackingNumber', 'trackingNumber')}</p>}
                    <ul>
                      {items.map((item, itemIndex) => (
                        <li key={field(item, 'OrderItemId', 'orderItemId', itemIndex)}>
                          <span>{field(item, 'ProductName', 'productName', 'Carpet')}{field(item, 'SizeLabel', 'sizeLabel') ? ` · ${field(item, 'SizeLabel', 'sizeLabel')}` : ''} × {field(item, 'Quantity', 'quantity', 1)}</span>
                          <strong>{formatMoney(field(item, 'LineTotal', 'lineTotal', field(item, 'UnitPrice', 'unitPrice', 0)))}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      ) : (
        <p className="commerce-empty">Abhi tak koi order nahi hai. Shop collection dekhkar apna pehla rug chunein.</p>
      )}
    </div>
  )
}

function CustomerReturnRequests({ token }) {
  const [orders, setOrders] = useState([])
  const [requests, setRequests] = useState([])
  const [form, setForm] = useState({ OrderId: '', RequestType: 'RETURN', Reason: '', Description: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const results = await Promise.allSettled([getCustomerOrders(token), getCustomerReturnRequests(token)])
    if (results[0].status === 'fulfilled') setOrders(results[0].value)
    if (results[1].status === 'fulfilled') setRequests(results[1].value)
    const errors = results.filter((result) => result.status === 'rejected').map((result) => result.reason.message)
    if (errors.length) setError(errors.join(' · '))
    setLoading(false)
  }, [token])

  useEffect(() => {
    let active = true
    Promise.allSettled([getCustomerOrders(token), getCustomerReturnRequests(token)]).then((results) => {
      if (!active) return
      if (results[0].status === 'fulfilled') setOrders(results[0].value)
      if (results[1].status === 'fulfilled') setRequests(results[1].value)
      const errors = results.filter((result) => result.status === 'rejected').map((result) => result.reason.message)
      if (errors.length) setError(errors.join(' · '))
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [token])

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await createCustomerReturnRequest(token, {
        ...form,
        OrderId: Number(form.OrderId),
        Reason: form.Reason.trim(),
        Description: form.Description.trim() || null,
      })
      setForm({ OrderId: '', RequestType: 'RETURN', Reason: '', Description: '' })
      setNotice('Your request has been submitted. You can track its status below.')
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="commerce-section">
      <div className="commerce-section-heading">
        <div><h3>Returns & cancellations</h3><p>Submit a request for an order and track the review/refund status.</p></div>
        <button className="commerce-refresh" disabled={loading} onClick={load} type="button">Refresh</button>
      </div>
      {error && <p className="customer-message customer-message-error" role="alert">{error}</p>}
      {notice && <p className="customer-message customer-message-success" role="status">{notice}</p>}
      <form className="commerce-address-form" onSubmit={submit}>
        <h3>Submit a request</h3>
        <div className="commerce-form-grid">
          <label className="customer-field">Order
            <select onChange={(event) => setForm({ ...form, OrderId: event.target.value })} required value={form.OrderId}>
              <option value="">Choose an order</option>
              {orders.map((order) => {
                const id = field(order, 'OrderId', 'orderId')
                return <option key={id} value={id}>{field(order, 'OrderNumber', 'orderNumber', `Order #${id}`)} · {field(order, 'OrderStatus', 'orderStatus', '')}</option>
              })}
            </select>
          </label>
          <label className="customer-field">Request type
            <select onChange={(event) => setForm({ ...form, RequestType: event.target.value })} value={form.RequestType}><option value="RETURN">Return</option><option value="CANCELLATION">Cancellation</option></select>
          </label>
          <label className="customer-field commerce-field-wide">Reason
            <input maxLength={250} onChange={(event) => setForm({ ...form, Reason: event.target.value })} required value={form.Reason} />
          </label>
          <label className="customer-field commerce-field-wide">Details <span>Optional</span>
            <textarea maxLength={1000} onChange={(event) => setForm({ ...form, Description: event.target.value })} rows={3} value={form.Description} />
          </label>
        </div>
        <button className="customer-submit" disabled={saving || orders.length === 0} type="submit">{saving ? 'Submitting…' : 'Submit request'}</button>
      </form>
      <div className="commerce-section-heading"><div><h3>Your requests</h3><p>Decision and refund progress from the store team.</p></div><span className="commerce-count">{requests.length}</span></div>
      {loading ? <p aria-live="polite" className="customer-loading">Requests load ho rahi hain…</p> : requests.length === 0 ? <p className="commerce-empty">You have not submitted a return or cancellation request.</p> : (
        <div className="commerce-order-list">
          {requests.map((request, index) => <article className="commerce-order-card" key={field(request, 'ReturnRequestId', 'returnRequestId', index)}>
            <div className="commerce-order-heading"><div><span>{field(request, 'RequestType', 'requestType', 'Request')}</span><strong>Order {field(request, 'OrderNumber', 'orderNumber', field(request, 'OrderId', 'orderId'))}</strong></div><span className="commerce-order-status">{field(request, 'RequestStatus', 'requestStatus', 'PENDING')}</span></div>
            <p>{field(request, 'Reason', 'reason')}</p>
            {field(request, 'Description', 'description') && <p>{field(request, 'Description', 'description')}</p>}
            <div className="commerce-order-meta"><span>Refund: {field(request, 'RefundStatus', 'refundStatus', 'PENDING')}</span><strong>{field(request, 'RefundAmount', 'refundAmount') ? formatMoney(field(request, 'RefundAmount', 'refundAmount')) : '—'}</strong></div>
          </article>)}
        </div>
      )}
    </div>
  )
}

function CustomerNotifications({ token }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setNotifications(await getMyNotifications(token))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    let active = true
    getMyNotifications(token).then((items) => {
      if (active) setNotifications(items)
    }).catch((requestError) => {
      if (active) setError(requestError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [token])

  async function markAllRead() {
    try {
      await markMyNotificationsRead(token)
      setNotice('All notifications marked as read.')
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function markRead(notification) {
    try {
      await markMyNotificationRead(token, field(notification, 'NotificationId', 'notificationId'))
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="commerce-section">
      <div className="commerce-section-heading"><div><h3>Your notifications</h3><p>Order updates and messages from the store.</p></div><button className="commerce-refresh" disabled={loading || notifications.length === 0} onClick={markAllRead} type="button">Mark all read</button></div>
      {error && <p className="customer-message customer-message-error" role="alert">{error}</p>}
      {notice && <p className="customer-message customer-message-success" role="status">{notice}</p>}
      {loading ? <p aria-live="polite" className="customer-loading">Notifications load ho rahi hain…</p> : notifications.length === 0 ? <p className="commerce-empty">You have no notifications yet.</p> : <div className="commerce-order-list">{notifications.map((item, index) => {
        const read = field(item, 'IsRead', 'isRead', false) === true || field(item, 'IsRead', 'isRead') === 1
        return <article className="commerce-order-card" key={field(item, 'NotificationId', 'notificationId', index)}>
          <div className="commerce-order-heading"><div><span>{field(item, 'NotificationType', 'notificationType', 'Update')}</span><strong>{field(item, 'Title', 'title')}</strong></div><span className="commerce-order-status">{read ? 'Read' : 'New'}</span></div>
          <p>{field(item, 'Message', 'message')}</p>
          {field(item, 'CreatedAt', 'createdAt') && <small>{formatDate(field(item, 'CreatedAt', 'createdAt'))}</small>}
          {!read && <div className="commerce-card-actions"><button onClick={() => markRead(item)} type="button">Mark as read</button></div>}
        </article>
      })}</div>}
    </div>
  )
}

function CustomerReviews({ token }) {
  const [reviews, setReviews] = useState([])
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ ProductId: '', Rating: '5', ReviewText: '' })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadReviews = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setReviews(await getMyReviews(token))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    let active = true
    Promise.all([getMyReviews(token), getProducts()]).then(([reviewItems, productItems]) => {
      if (!active) return
      setReviews(reviewItems)
      setProducts(productItems)
    }).catch((requestError) => {
      if (active) setError(requestError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [token])

  function startEdit(review) {
    setEditingId(field(review, 'ReviewId', 'reviewId'))
    setForm({
      ProductId: String(field(review, 'ProductId', 'productId')),
      Rating: String(field(review, 'Rating', 'rating', 5)),
      ReviewText: field(review, 'ReviewText', 'reviewText'),
    })
    setError('')
    setNotice('')
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const payload = { Rating: Number(form.Rating), ReviewText: form.ReviewText.trim() || null }
      if (editingId) {
        await updateCustomerReview(token, editingId, payload)
        setNotice('Review updated. It will be visible after admin approval.')
      } else {
        await createCustomerReview(token, { ...payload, ProductId: Number(form.ProductId) })
        setNotice('Review submitted. It will be visible after admin approval.')
      }
      setEditingId(null)
      setForm({ ProductId: '', Rating: '5', ReviewText: '' })
      await loadReviews()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(review) {
    if (!window.confirm('Delete this review?')) return
    try {
      await deleteCustomerReview(token, field(review, 'ReviewId', 'reviewId'))
      await loadReviews()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="commerce-section">
      <div className="commerce-section-heading"><div><h3>Your reviews</h3><p>Share your experience with products you have purchased.</p></div><span className="commerce-count">{reviews.length}</span></div>
      {error && <p className="customer-message customer-message-error" role="alert">{error}</p>}
      {notice && <p className="customer-message customer-message-success" role="status">{notice}</p>}
      <form className="commerce-address-form" onSubmit={submit}>
        <h3>{editingId ? 'Edit your review' : 'Write a review'}</h3>
        <div className="commerce-form-grid">
          <label className="customer-field commerce-field-wide">Product
            <select disabled={Boolean(editingId)} onChange={(event) => setForm({ ...form, ProductId: event.target.value })} required value={form.ProductId}><option value="">Choose a product</option>{products.map((product) => <option key={field(product, 'ProductId', 'productId')} value={field(product, 'ProductId', 'productId')}>{field(product, 'ProductName', 'productName')}</option>)}</select>
          </label>
          <label className="customer-field">Rating
            <select onChange={(event) => setForm({ ...form, Rating: event.target.value })} value={form.Rating}><option value="5">5 — Loved it</option><option value="4">4 — Great</option><option value="3">3 — Good</option><option value="2">2 — Could be better</option><option value="1">1 — Not satisfied</option></select>
          </label>
          <label className="customer-field commerce-field-wide">Review <span>Optional</span>
            <textarea maxLength={1000} onChange={(event) => setForm({ ...form, ReviewText: event.target.value })} rows={3} value={form.ReviewText} />
          </label>
        </div>
        <div className="commerce-form-actions"><button className="customer-submit" disabled={saving} type="submit">{saving ? 'Saving…' : editingId ? 'Update review' : 'Submit review'}</button>{editingId && <button className="commerce-cancel-edit" onClick={() => { setEditingId(null); setForm({ ProductId: '', Rating: '5', ReviewText: '' }) }} type="button">Cancel</button>}</div>
      </form>
      {loading ? <p aria-live="polite" className="customer-loading">Reviews load ho rahe hain…</p> : reviews.length === 0 ? <p className="commerce-empty">You have not submitted any reviews yet.</p> : <div className="commerce-order-list">{reviews.map((review, index) => <article className="commerce-order-card" key={field(review, 'ReviewId', 'reviewId', index)}>
        <div className="commerce-order-heading"><div><strong>{field(review, 'ProductName', 'productName', `Product ${field(review, 'ProductId', 'productId')}`)}</strong><span>{'★'.repeat(Number(field(review, 'Rating', 'rating', 0)))}</span></div><span className="commerce-order-status">{field(review, 'IsApproved', 'isApproved', false) ? 'Published' : 'Awaiting approval'}</span></div>
        <p>{field(review, 'ReviewText', 'reviewText', 'No written comment.')}</p>
        <div className="commerce-card-actions"><button onClick={() => startEdit(review)} type="button">Edit</button><button className="commerce-danger-action" onClick={() => remove(review)} type="button">Delete</button></div>
      </article>)}</div>}
    </div>
  )
}

export default function CustomerCommercePanel({ section, token }) {
  if (section === 'addresses') return <AddressBook token={token} />
  if (section === 'returns') return <CustomerReturnRequests token={token} />
  if (section === 'notifications') return <CustomerNotifications token={token} />
  if (section === 'reviews') return <CustomerReviews token={token} />
  return <OrdersList token={token} />
}
