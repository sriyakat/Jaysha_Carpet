import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from '../../category/components/Icon.jsx'
import AdminModuleLayout from '../../shared/components/AdminModuleLayout.jsx'
import {
  createAdminPayment,
  getAdminPayments,
  getOrdersForPayments,
  updateAdminPaymentGateway,
  updateAdminPaymentStatus,
} from '../api/adminPaymentApi.js'
import './PaymentsPage.css'

const PAYMENT_STATUSES = ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED']

function field(item, camelName, pascalName, fallback = '') {
  return item?.[camelName] ?? item?.[pascalName] ?? fallback
}

function formatPrice(value, currency = 'INR') {
  const amount = Number(value)
  return Number.isFinite(amount)
    ? new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
    : '—'
}

function orderPaymentAmount(order) {
  const amountInr = Number(field(order, 'grandTotal', 'GrandTotal', 0))
  const currency = field(order, 'currencyCode', 'CurrencyCode', 'INR')
  const usdGrandTotal = Number(field(order, 'usdGrandTotal', 'UsdGrandTotal', Number.NaN))
  if (currency === 'USD' && Number.isFinite(usdGrandTotal) && usdGrandTotal > 0) return usdGrandTotal
  const inrPerUsd = Number(field(order, 'inrPerUsd', 'InrPerUsd', 0))
  return currency === 'USD' && inrPerUsd > 0 ? Math.round((amountInr / inrPerUsd) * 100) / 100 : amountInr
}

function formatOrderPrice(order) {
  const currency = field(order, 'currencyCode', 'CurrencyCode', 'INR')
  return formatPrice(orderPaymentAmount(order), currency)
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function PaymentsPage({ user, onLogout, onNavigate }) {
  const [payments, setPayments] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [actionError, setActionError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [gatewayPayment, setGatewayPayment] = useState(null)
  const [gatewayForm, setGatewayForm] = useState({})
  const [gatewayError, setGatewayError] = useState('')
  const [savingGateway, setSavingGateway] = useState(false)
  const [createModal, setCreateModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ OrderId: '', PaymentMethod: 'COD', Amount: '' })
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  const loadPayments = useCallback(async () => {
    setLoading(true)
    setListError('')
    try {
      setPayments(await getAdminPayments())
    } catch (error) {
      setListError(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    getAdminPayments()
      .then((items) => { if (active) setPayments(items) })
      .catch((error) => { if (active) setListError(error.message) })
      .finally(() => { if (active) setLoading(false) })
    getOrdersForPayments()
      .then((items) => { if (active) setOrders(items) })
      .catch((error) => { if (active) setActionError(`Order list load nahi ho saki: ${error.message}`) })
    return () => { active = false }
  }, [])

  const visiblePayments = useMemo(() => {
    const query = search.trim().toLowerCase()
    return [...payments]
      .sort((first, second) => new Date(field(second, 'createdAt', 'CreatedAt', 0)) - new Date(field(first, 'createdAt', 'CreatedAt', 0)))
      .filter((payment) => {
        const status = String(field(payment, 'paymentStatus', 'PaymentStatus')).toUpperCase()
        const method = String(field(payment, 'paymentMethod', 'PaymentMethod')).toUpperCase()
        const searchable = `${field(payment, 'orderNumber', 'OrderNumber')} ${field(payment, 'customerName', 'CustomerName')} ${field(payment, 'mobileNumber', 'MobileNumber')} ${field(payment, 'gatewayPaymentId', 'GatewayPaymentId')}`.toLowerCase()
        return searchable.includes(query) && (!statusFilter || status === statusFilter) && (!methodFilter || method === methodFilter)
      })
  }, [payments, search, statusFilter, methodFilter])

  const successfulPayments = payments.filter((payment) => String(field(payment, 'paymentStatus', 'PaymentStatus')).toUpperCase() === 'SUCCESS')
  const pendingPayments = payments.filter((payment) => String(field(payment, 'paymentStatus', 'PaymentStatus')).toUpperCase() === 'PENDING')
  const collectedAmount = successfulPayments.reduce((total, payment) => {
    const amount = Number(field(payment, 'amount', 'Amount', 0))
    const currency = field(payment, 'currencyCode', 'CurrencyCode', 'INR')
    const inrPerUsd = Number(field(payment, 'inrPerUsd', 'InrPerUsd', 0))
    return total + (currency === 'USD' && inrPerUsd > 0 ? amount * inrPerUsd : amount)
  }, 0)
  const paymentOrders = orders.filter((order) => !payments.some((payment) => String(field(payment, 'orderId', 'OrderId')) === String(field(order, 'orderId', 'OrderId'))))

  function openCreatePayment() {
    const firstOrder = paymentOrders[0]
    setPaymentForm({
      OrderId: firstOrder ? String(field(firstOrder, 'orderId', 'OrderId')) : '',
      PaymentMethod: 'COD',
      Amount: firstOrder ? String(orderPaymentAmount(firstOrder)) : '',
    })
    setCreateError('')
    setCreateModal(true)
  }

  async function submitPayment(event) {
    event.preventDefault()
    setCreating(true)
    setCreateError('')
    try {
      await createAdminPayment({
        OrderId: Number(paymentForm.OrderId),
        PaymentMethod: paymentForm.PaymentMethod,
        Amount: Number(paymentForm.Amount),
      })
      setCreateModal(false)
      await loadPayments()
    } catch (error) {
      setCreateError(error.message)
    } finally {
      setCreating(false)
    }
  }

  async function changeStatus(payment, nextStatus) {
    const id = field(payment, 'paymentId', 'PaymentId')
    if (!id || nextStatus === field(payment, 'paymentStatus', 'PaymentStatus')) return
    setActionError('')
    setUpdatingPaymentId(id)
    try {
      await updateAdminPaymentStatus(id, nextStatus)
      setPayments((current) => current.map((item) => String(field(item, 'paymentId', 'PaymentId')) === String(id)
        ? { ...item, PaymentStatus: nextStatus, paymentStatus: nextStatus }
        : item))
      setSelectedPayment((current) => current && String(field(current, 'paymentId', 'PaymentId')) === String(id)
        ? { ...current, PaymentStatus: nextStatus, paymentStatus: nextStatus }
        : current)
    } catch (error) {
      setActionError(error.message)
    } finally {
      setUpdatingPaymentId(null)
    }
  }

  function openGateway(payment) {
    setGatewayPayment(payment)
    setGatewayForm({
      GatewayName: field(payment, 'gatewayName', 'GatewayName'),
      GatewayOrderId: field(payment, 'gatewayOrderId', 'GatewayOrderId'),
      GatewayPaymentId: field(payment, 'gatewayPaymentId', 'GatewayPaymentId'),
      GatewaySignature: field(payment, 'gatewaySignature', 'GatewaySignature'),
    })
    setGatewayError('')
  }

  async function saveGateway(event) {
    event.preventDefault()
    const paymentId = field(gatewayPayment, 'paymentId', 'PaymentId')
    setSavingGateway(true)
    setGatewayError('')
    try {
      await updateAdminPaymentGateway(paymentId, gatewayForm)
      setPayments((current) => current.map((payment) => String(field(payment, 'paymentId', 'PaymentId')) === String(paymentId)
        ? { ...payment, ...gatewayForm }
        : payment))
      setGatewayPayment(null)
    } catch (error) {
      setGatewayError(error.message)
    } finally {
      setSavingGateway(false)
    }
  }

  return (
    <AdminModuleLayout activeModule="payments" title="Payments" user={user} onLogout={onLogout} onNavigate={onNavigate}>
        <div className="page-content">
          <div className="page-heading payments-heading"><div><p className="eyebrow"><span className="eyebrow-dot" /> Finance overview</p><h1>Payments</h1><p>Collection status, payment methods aur gateway references ek jagah manage karein.</p></div><div className="payments-heading-actions"><button className="secondary-button" disabled={loading} onClick={loadPayments} type="button">Refresh</button><button className="primary-button" disabled={!paymentOrders.length} onClick={openCreatePayment} type="button"><Icon name="plus" size={17} />Record payment</button></div><div aria-hidden="true" className="hero-ornament"><span className="ornament-ring ring-one" /><span className="ornament-ring ring-two" /><span className="ornament-center"><Icon name="sparkle" size={30} /></span></div></div>
          {actionError && <div className="page-error" role="alert"><Icon name="warning" size={17} /><span>{actionError}</span></div>}

          <div className="overview-grid">
            <article className="overview-card"><span className="overview-icon"><Icon name="sparkle" size={20} /></span><div><p className="overview-label">Total payments</p><p className="overview-value">{loading ? '—' : payments.length}</p></div></article>
            <article className="overview-card"><span className="overview-icon payments-success-icon"><Icon name="category" size={20} /></span><div><p className="overview-label">Successfully collected (INR equivalent)</p><p className="overview-value payments-total">{loading ? '—' : formatPrice(collectedAmount)}</p></div></article>
            <article className="overview-card"><span className="overview-icon payments-pending-icon"><Icon name="warning" size={20} /></span><div><p className="overview-label">Awaiting payment</p><p className="overview-value">{loading ? '—' : pendingPayments.length}</p></div></article>
            <article className="overview-card"><span className="overview-icon"><Icon name="box" size={20} /></span><div><p className="overview-label">Payment methods</p><p className="overview-value">{loading ? '—' : new Set(payments.map((payment) => field(payment, 'paymentMethod', 'PaymentMethod'))).size}</p></div></article>
          </div>

          <section aria-label="Payments" className="table-card payments-table-card">
            <div className="table-toolbar"><div><h2 className="table-title">Payment records</h2><p className="table-subtitle">{visiblePayments.length} records shown</p></div><div className="payments-filters"><label className="search-box"><Icon name="search" size={16} /><input aria-label="Search payments" onChange={(event) => setSearch(event.target.value)} placeholder="Search order or customer..." type="search" value={search} /></label><select aria-label="Filter by payment status" className="payments-filter" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}><option value="">All statuses</option>{PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select><select aria-label="Filter by payment method" className="payments-filter" onChange={(event) => setMethodFilter(event.target.value)} value={methodFilter}><option value="">All methods</option><option value="COD">COD</option><option value="ONLINE">Online</option></select></div></div>
            {loading ? <div aria-live="polite" className="loading-state"><span className="spinner" /><span>Payments load ho rahe hain...</span></div>
              : listError ? <div className="empty-state" role="alert"><span className="overview-icon"><Icon name="warning" size={21} /></span><h3>Payments load nahi ho sake</h3><p>{listError}</p><button className="secondary-button" onClick={loadPayments} type="button">Retry</button></div>
                : visiblePayments.length === 0 ? <div className="empty-state"><span className="overview-icon"><Icon name="sparkle" size={21} /></span><h3>{payments.length ? 'Koi matching payment nahi mili' : 'Abhi payment records nahi hain'}</h3><p>New payment record yahan dikhai dega.</p></div>
                  : <div className="table-scroll"><table className="category-table payments-table"><thead><tr><th>Order</th><th>Customer</th><th>Method</th><th>Amount</th><th>Status</th><th>Paid / created</th><th>Gateway</th><th>Details</th></tr></thead><tbody>{visiblePayments.map((payment, index) => {
                    const id = field(payment, 'paymentId', 'PaymentId', index)
                    const status = String(field(payment, 'paymentStatus', 'PaymentStatus', 'PENDING')).toUpperCase()
                    const tone = status === 'SUCCESS' ? 'success' : status === 'FAILED' || status === 'REFUNDED' ? 'failed' : 'pending'
                    return <tr key={id}><td><strong className="payments-order-number">{field(payment, 'orderNumber', 'OrderNumber', `Order #${field(payment, 'orderId', 'OrderId')}`)}</strong><span className="payments-cell-muted">Payment #{id}</span></td><td><strong className="payments-customer">{field(payment, 'customerName', 'CustomerName', 'Customer')}</strong><span className="payments-cell-muted">{field(payment, 'mobileNumber', 'MobileNumber', '—')}</span></td><td><span className={`payments-method ${String(field(payment, 'paymentMethod', 'PaymentMethod')).toLowerCase()}`}>{field(payment, 'paymentMethod', 'PaymentMethod', '—')}</span></td><td><strong className="payments-amount">{formatPrice(field(payment, 'amount', 'Amount'), field(payment, 'currencyCode', 'CurrencyCode', 'INR'))}</strong></td><td><select aria-label={`Update status for payment ${id}`} className={`payments-status-select ${tone}`} disabled={updatingPaymentId === id} onChange={(event) => changeStatus(payment, event.target.value)} value={status}>{!PAYMENT_STATUSES.includes(status) && <option value={status}>{status}</option>}{PAYMENT_STATUSES.map((option) => <option key={option} value={option}>{option}</option>)}</select></td><td>{formatDate(field(payment, 'paidAt', 'PaidAt') || field(payment, 'createdAt', 'CreatedAt'))}</td><td><span className="payments-gateway-name">{field(payment, 'gatewayName', 'GatewayName') || 'Manual / COD'}</span><span className="payments-cell-muted">{field(payment, 'gatewayPaymentId', 'GatewayPaymentId') || 'No gateway reference'}</span></td><td><div className="payments-row-actions"><button className="secondary-button payments-view-button" onClick={() => setSelectedPayment(payment)} type="button">View</button><button aria-label={`Edit gateway details for payment ${id}`} className="payments-edit-button" onClick={() => openGateway(payment)} title="Edit gateway details" type="button"><Icon name="edit" size={15} /></button></div></td></tr>
                  })}</tbody></table></div>}
          </section>
        </div>

      {createModal && <div className="payments-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !creating) setCreateModal(false) }}><section aria-labelledby="create-payment-title" aria-modal="true" className="payments-modal" role="dialog"><header className="payments-modal-header"><div><p className="eyebrow">New record</p><h2 id="create-payment-title">Record payment</h2><p>Order ke liye payment record add karein.</p></div><button aria-label="Close record payment form" className="payments-close-button" disabled={creating} onClick={() => setCreateModal(false)} type="button"><Icon name="close" size={19} /></button></header><form className="payments-modal-form" onSubmit={submitPayment}>{createError && <div className="page-error" role="alert"><Icon name="warning" size={16} /><span>{createError}</span></div>}<label>Order<select onChange={(event) => { const selected = paymentOrders.find((order) => String(field(order, 'orderId', 'OrderId')) === event.target.value); setPaymentForm((current) => ({ ...current, OrderId: event.target.value, Amount: selected ? String(orderPaymentAmount(selected)) : '' })) }} required value={paymentForm.OrderId}><option value="">Choose order</option>{paymentOrders.map((order) => <option key={field(order, 'orderId', 'OrderId')} value={field(order, 'orderId', 'OrderId')}>{field(order, 'orderNumber', 'OrderNumber')} · {field(order, 'customerName', 'CustomerName')} · {formatOrderPrice(order)}</option>)}</select></label><div className="payments-form-row"><label>Payment method<select onChange={(event) => setPaymentForm((current) => ({ ...current, PaymentMethod: event.target.value }))} value={paymentForm.PaymentMethod}><option value="COD">Cash on delivery</option><option value="ONLINE">Online</option></select></label><label>Amount<input min="0" onChange={(event) => setPaymentForm((current) => ({ ...current, Amount: event.target.value }))} required step="0.01" type="number" value={paymentForm.Amount} /></label></div><footer><button className="secondary-button" disabled={creating} onClick={() => setCreateModal(false)} type="button">Cancel</button><button className="primary-button" disabled={creating || !paymentForm.OrderId} type="submit">{creating ? 'Saving...' : 'Save payment'}</button></footer></form></section></div>}

      {gatewayPayment && <div className="payments-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingGateway) setGatewayPayment(null) }}><section aria-labelledby="gateway-title" aria-modal="true" className="payments-modal" role="dialog"><header className="payments-modal-header"><div><p className="eyebrow">Payment #{field(gatewayPayment, 'paymentId', 'PaymentId')}</p><h2 id="gateway-title">Gateway details</h2><p>Optional gateway identifiers and verification reference.</p></div><button aria-label="Close gateway details form" className="payments-close-button" disabled={savingGateway} onClick={() => setGatewayPayment(null)} type="button"><Icon name="close" size={19} /></button></header><form className="payments-modal-form" onSubmit={saveGateway}>{gatewayError && <div className="page-error" role="alert"><Icon name="warning" size={16} /><span>{gatewayError}</span></div>}{[['GatewayName', 'Gateway name'], ['GatewayOrderId', 'Gateway order ID'], ['GatewayPaymentId', 'Gateway payment ID'], ['GatewaySignature', 'Gateway signature']].map(([key, label]) => <label key={key}>{label}<input maxLength={key === 'GatewaySignature' ? 500 : 150} onChange={(event) => setGatewayForm((current) => ({ ...current, [key]: event.target.value }))} value={gatewayForm[key] || ''} /></label>)}<footer><button className="secondary-button" disabled={savingGateway} onClick={() => setGatewayPayment(null)} type="button">Cancel</button><button className="primary-button" disabled={savingGateway} type="submit">{savingGateway ? 'Saving...' : 'Save gateway details'}</button></footer></form></section></div>}

      {selectedPayment && <div className="payments-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedPayment(null) }}><section aria-labelledby="payment-details-title" aria-modal="true" className="payments-modal payment-details-modal" role="dialog"><header className="payments-modal-header"><div><p className="eyebrow">Payment record</p><h2 id="payment-details-title">{field(selectedPayment, 'orderNumber', 'OrderNumber', `Order #${field(selectedPayment, 'orderId', 'OrderId')}`)}</h2><p>Payment #{field(selectedPayment, 'paymentId', 'PaymentId')} · {formatDate(field(selectedPayment, 'createdAt', 'CreatedAt'))}</p></div><button aria-label="Close payment details" className="payments-close-button" onClick={() => setSelectedPayment(null)} type="button"><Icon name="close" size={19} /></button></header><div className="payment-details-body"><div className="payment-details-highlight"><span>Payment amount</span><strong>{formatPrice(field(selectedPayment, 'amount', 'Amount'), field(selectedPayment, 'currencyCode', 'CurrencyCode', 'INR'))}</strong><span className={`payments-status-pill ${String(field(selectedPayment, 'paymentStatus', 'PaymentStatus')).toLowerCase()}`}>{field(selectedPayment, 'paymentStatus', 'PaymentStatus')}</span></div><div className="payment-details-grid"><div><span>Customer</span><strong>{field(selectedPayment, 'customerName', 'CustomerName', '—')}</strong></div><div><span>Mobile</span><strong>{field(selectedPayment, 'mobileNumber', 'MobileNumber', '—')}</strong></div><div><span>Method</span><strong>{field(selectedPayment, 'paymentMethod', 'PaymentMethod', '—')}</strong></div><div><span>Paid at</span><strong>{formatDate(field(selectedPayment, 'paidAt', 'PaidAt'))}</strong></div><div><span>Gateway</span><strong>{field(selectedPayment, 'gatewayName', 'GatewayName') || 'Manual / COD'}</strong></div><div><span>Gateway order ID</span><strong>{field(selectedPayment, 'gatewayOrderId', 'GatewayOrderId', '—') || '—'}</strong></div><div><span>Gateway payment ID</span><strong>{field(selectedPayment, 'gatewayPaymentId', 'GatewayPaymentId', '—') || '—'}</strong></div><div><span>Signature</span><strong className="payment-signature">{field(selectedPayment, 'gatewaySignature', 'GatewaySignature', '—') || '—'}</strong></div></div><button className="secondary-button payment-details-edit" onClick={() => { setSelectedPayment(null); openGateway(selectedPayment) }} type="button"><Icon name="edit" size={15} />Edit gateway details</button></div></section></div>}
    </AdminModuleLayout>
  )
}

export default PaymentsPage
