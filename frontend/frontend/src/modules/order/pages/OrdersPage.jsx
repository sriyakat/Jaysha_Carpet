import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from '../../category/components/Icon.jsx'
import AdminModuleLayout from '../../shared/components/AdminModuleLayout.jsx'
import { getAdminOrderItems, getAdminOrders, updateAdminOrderStatus } from '../api/adminOrderApi.js'
import './OrdersPage.css'

const ORDER_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']

function orderValue(order, camelName, pascalName, fallback = '') {
  return order?.[camelName] ?? order?.[pascalName] ?? fallback
}

function formatPrice(value, order = null, directUsdAmount = null) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  const currency = orderValue(order, 'currencyCode', 'CurrencyCode', 'INR')
  const rate = Number(orderValue(order, 'inrPerUsd', 'InrPerUsd', 0))
  const usdAmount = directUsdAmount === null || directUsdAmount === undefined || directUsdAmount === ''
    ? Number.NaN
    : Number(directUsdAmount)
  const displayAmount = currency === 'USD'
    ? Number.isFinite(usdAmount) && usdAmount >= 0
      ? usdAmount
      : rate > 0 ? amount / rate : amount
    : amount
  return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'USD' ? 2 : 2,
  }).format(displayAmount)
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function orderId(order) {
  return orderValue(order, 'orderId', 'OrderId')
}

function OrdersPage({ user, onLogout, onNavigate }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [actionError, setActionError] = useState('')
  const [updatingOrderId, setUpdatingOrderId] = useState(null)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setListError('')
    try {
      setOrders(await getAdminOrders())
    } catch (error) {
      setListError(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    getAdminOrders()
      .then((items) => {
        if (active) setOrders(items)
      })
      .catch((error) => {
        if (active) setListError(error.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase()
    return [...orders]
      .sort((first, second) => new Date(orderValue(second, 'createdAt', 'CreatedAt', 0)) - new Date(orderValue(first, 'createdAt', 'CreatedAt', 0)))
      .filter((order) => {
        const orderNumber = orderValue(order, 'orderNumber', 'OrderNumber')
        const customer = orderValue(order, 'customerName', 'CustomerName')
        const email = orderValue(order, 'email', 'Email')
        const mobile = orderValue(order, 'mobileNumber', 'MobileNumber')
        const status = orderValue(order, 'orderStatus', 'OrderStatus')
        const matchesQuery = `${orderNumber} ${customer} ${email} ${mobile}`.toLowerCase().includes(query)
        return matchesQuery && (!statusFilter || status === statusFilter)
      })
  }, [orders, search, statusFilter])

  async function openOrder(order) {
    const id = orderId(order)
    if (id === undefined || id === null) {
      setActionError('Is order ka ID nahi mila, details load nahi ho sakti.')
      return
    }

    setActionError('')
    setSelectedOrder(order)
    setOrderItems([])
    setDetailsError('')
    setDetailsLoading(true)
    try {
      setOrderItems(await getAdminOrderItems(id))
    } catch (error) {
      setDetailsError(error.message)
    } finally {
      setDetailsLoading(false)
    }
  }

  async function changeStatus(order, nextStatus) {
    const id = orderId(order)
    if (!id || !nextStatus || nextStatus === orderValue(order, 'orderStatus', 'OrderStatus')) return

    setActionError('')
    setUpdatingOrderId(id)
    try {
      await updateAdminOrderStatus(id, nextStatus)
      setOrders((current) => current.map((item) => (
        orderId(item) === id
          ? { ...item, OrderStatus: nextStatus, orderStatus: nextStatus }
          : item
      )))
      setSelectedOrder((current) => current && orderId(current) === id
        ? { ...current, OrderStatus: nextStatus, orderStatus: nextStatus }
        : current)
    } catch (error) {
      setActionError(error.message)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const pendingCount = orders.filter((order) => ['PENDING', 'CONFIRMED'].includes(orderValue(order, 'orderStatus', 'OrderStatus'))).length
  const totalRevenue = orders.reduce((total, order) => total + Number(orderValue(order, 'grandTotal', 'GrandTotal', 0)), 0)

  return (
    <AdminModuleLayout activeModule="orders" title="Orders" user={user} onLogout={onLogout} onNavigate={onNavigate}>
        <div className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow"><span className="eyebrow-dot" /> Sales management</p>
              <h1>Orders</h1>
              <p>Customer orders, delivery information aur ordered items yahan dekhein.</p>
            </div>
            <button className="secondary-button orders-refresh" disabled={loading} onClick={loadOrders} type="button">Refresh orders</button>
            <div aria-hidden="true" className="hero-ornament">
              <span className="ornament-ring ring-one" />
              <span className="ornament-ring ring-two" />
              <span className="ornament-center"><Icon name="box" size={30} /></span>
            </div>
          </div>

          {actionError && <div className="page-error" role="alert"><Icon name="warning" size={17} /><span>{actionError}</span></div>}

          <div className="overview-grid">
            <article className="overview-card"><span className="overview-icon"><Icon name="box" size={20} /></span><div><p className="overview-label">Total orders</p><p className="overview-value">{loading ? '—' : orders.length}</p></div></article>
            <article className="overview-card"><span className="overview-icon"><Icon name="sparkle" size={20} /></span><div><p className="overview-label">Needs attention</p><p className="overview-value">{loading ? '—' : pendingCount}</p></div></article>
            <article className="overview-card"><span className="overview-icon"><Icon name="category" size={20} /></span><div><p className="overview-label">Order value (INR base)</p><p className="overview-value orders-revenue">{loading ? '—' : formatPrice(totalRevenue)}</p></div></article>
          </div>

          <section aria-label="Customer orders" className="table-card">
            <div className="table-toolbar">
              <div><h2 className="table-title">All customer orders</h2><p className="table-subtitle">{visibleOrders.length} orders shown</p></div>
              <div className="orders-filters">
                <label className="search-box"><Icon name="search" size={16} /><input aria-label="Search orders" onChange={(event) => setSearch(event.target.value)} placeholder="Search name or order..." type="search" value={search} /></label>
                <select aria-label="Filter by order status" className="orders-status-filter" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                  <option value="">All statuses</option>
                  {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <div aria-live="polite" className="loading-state"><span className="spinner" /><span>Orders load ho rahe hain...</span></div>
            ) : listError ? (
              <div className="empty-state" role="alert"><span className="overview-icon"><Icon name="warning" size={21} /></span><h3>Orders load nahi ho sake</h3><p>{listError}</p><button className="secondary-button" onClick={loadOrders} type="button">Retry</button></div>
            ) : visibleOrders.length === 0 ? (
              <div className="empty-state"><span className="overview-icon"><Icon name="box" size={21} /></span><h3>{orders.length ? 'Koi matching order nahi mila' : 'Abhi koi order nahi hai'}</h3><p>{orders.length ? 'Search ya status filter badal kar dobara try karein.' : 'Customer ke order place karte hi yahan dikh jayenge.'}</p></div>
            ) : (
              <div className="table-scroll">
                <table className="category-table orders-table">
                  <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th><th>Details</th></tr></thead>
                  <tbody>
                    {visibleOrders.map((order, index) => {
                      const id = orderId(order)
                      const status = String(orderValue(order, 'orderStatus', 'OrderStatus', 'PENDING')).toUpperCase()
                      return (
                        <tr key={id ?? index}>
                          <td><strong>{orderValue(order, 'orderNumber', 'OrderNumber', `#${id ?? '—'}`)}</strong></td>
                          <td><span className="orders-customer">{orderValue(order, 'customerName', 'CustomerName', 'Customer')}</span><span className="orders-contact">{orderValue(order, 'mobileNumber', 'MobileNumber')}</span></td>
                          <td>{formatDate(orderValue(order, 'createdAt', 'CreatedAt'))}</td>
                          <td><strong>{formatPrice(orderValue(order, 'grandTotal', 'GrandTotal'), order, orderValue(order, 'usdGrandTotal', 'UsdGrandTotal', null))}</strong></td>
                          <td><span>{orderValue(order, 'paymentMethod', 'PaymentMethod', '—')}</span><span className="orders-contact">{orderValue(order, 'paymentStatus', 'PaymentStatus')}</span></td>
                          <td>
                            {status === 'CANCELLED' ? <span className="orders-status cancelled">{status}</span> : (
                              <select aria-label={`Update status for ${orderValue(order, 'orderNumber', 'OrderNumber', id)}`} className={`orders-status-select status-${status.toLowerCase()}`} disabled={updatingOrderId === id} onChange={(event) => changeStatus(order, event.target.value)} value={status}>
                                {!ORDER_STATUSES.includes(status) && <option value={status}>{status}</option>}
                                {ORDER_STATUSES.map((option) => <option key={option} value={option}>{option}</option>)}
                              </select>
                            )}
                          </td>
                          <td><button className="secondary-button orders-view-button" onClick={() => openOrder(order)} type="button">View details</button></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

      {selectedOrder && (
        <div className="orders-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedOrder(null) }}>
          <section aria-labelledby="order-details-title" aria-modal="true" className="orders-modal" role="dialog">
            <header className="orders-modal-header">
              <div><p className="eyebrow">Customer order</p><h2 id="order-details-title">{orderValue(selectedOrder, 'orderNumber', 'OrderNumber', `#${orderId(selectedOrder)}`)}</h2><p>Placed {formatDate(orderValue(selectedOrder, 'createdAt', 'CreatedAt'))}</p></div>
              <button aria-label="Close order details" className="orders-close-button" onClick={() => setSelectedOrder(null)} type="button"><Icon name="close" size={19} /></button>
            </header>
            <div className="orders-modal-body">
              <div className="orders-details-grid">
                <section className="orders-detail-card"><h3>Customer</h3><strong>{orderValue(selectedOrder, 'customerName', 'CustomerName', '—')}</strong><p>{orderValue(selectedOrder, 'email', 'Email', '—')}</p><p>{orderValue(selectedOrder, 'mobileNumber', 'MobileNumber', '—')}</p></section>
                <section className="orders-detail-card"><h3>Delivery address</h3><p>{orderValue(selectedOrder, 'addressLine', 'AddressLine', '—')}</p>{orderValue(selectedOrder, 'landmark', 'Landmark') && <p>{orderValue(selectedOrder, 'landmark', 'Landmark')}</p>}<p>{[orderValue(selectedOrder, 'city', 'City'), orderValue(selectedOrder, 'state', 'State'), orderValue(selectedOrder, 'pincode', 'Pincode')].filter(Boolean).join(', ')}</p><p>{orderValue(selectedOrder, 'country', 'Country', '')}</p></section>
              </div>
              <section className="orders-items-section"><h3>Items in this order</h3>
                {detailsLoading ? <div aria-live="polite" className="loading-state"><span className="spinner" /><span>Items load ho rahe hain...</span></div>
                  : detailsError ? <div className="orders-inline-error" role="alert">{detailsError}<button className="secondary-button" onClick={() => openOrder(selectedOrder)} type="button">Retry</button></div>
                    : orderItems.length === 0 ? <p className="orders-empty-items">Is order mein item details nahi milin.</p>
                      : <div className="orders-items-list">{orderItems.map((item, index) => {
                        const itemId = orderValue(item, 'orderItemId', 'OrderItemId', index)
                        const name = orderValue(item, 'productName', 'ProductName', 'Carpet')
                        const quantity = Number(orderValue(item, 'quantity', 'Quantity', 0))
                        const price = orderValue(item, 'unitPrice', 'UnitPrice', 0)
                        const lineTotal = orderValue(item, 'lineTotal', 'LineTotal', Number(price) * quantity)
                        return <article className="orders-item-row" key={itemId}><div><strong>{name}</strong><p>{orderValue(item, 'sku', 'SKU') ? `SKU: ${orderValue(item, 'sku', 'SKU')} · ` : ''}Qty: {quantity}</p></div><div className="orders-item-price"><span>{formatPrice(price, selectedOrder, orderValue(item, 'usdUnitPrice', 'UsdUnitPrice', null))} each</span><strong>{formatPrice(lineTotal, selectedOrder, orderValue(item, 'usdLineTotal', 'UsdLineTotal', null))}</strong></div></article>
                      })}</div>}
              </section>
              <section className="orders-summary">
                <div><span>Subtotal</span><strong>{formatPrice(orderValue(selectedOrder, 'subtotal', 'Subtotal'), selectedOrder, orderValue(selectedOrder, 'usdSubtotal', 'UsdSubtotal', null))}</strong></div>
                <div><span>Discount</span><strong>−{formatPrice(orderValue(selectedOrder, 'discountAmount', 'DiscountAmount', 0), selectedOrder)}</strong></div>
                <div><span>Shipping</span><strong>{formatPrice(orderValue(selectedOrder, 'shippingCharges', 'ShippingCharges', 0), selectedOrder, orderValue(selectedOrder, 'usdShippingCharges', 'UsdShippingCharges', null))}</strong></div>
                <div className="orders-grand-total"><span>Total</span><strong>{formatPrice(orderValue(selectedOrder, 'grandTotal', 'GrandTotal'), selectedOrder, orderValue(selectedOrder, 'usdGrandTotal', 'UsdGrandTotal', null))}</strong></div>
                <div><span>Payment</span><strong>{orderValue(selectedOrder, 'paymentMethod', 'PaymentMethod', '—')} · {orderValue(selectedOrder, 'paymentStatus', 'PaymentStatus', '—')}</strong></div>
                {orderValue(selectedOrder, 'trackingNumber', 'TrackingNumber') && <div><span>Tracking</span><strong>{orderValue(selectedOrder, 'trackingNumber', 'TrackingNumber')}</strong></div>}
                {orderValue(selectedOrder, 'customerNotes', 'CustomerNotes') && <div><span>Delivery note</span><strong>{orderValue(selectedOrder, 'customerNotes', 'CustomerNotes')}</strong></div>}
              </section>
            </div>
          </section>
        </div>
      )}
    </AdminModuleLayout>
  )
}

export default OrdersPage
