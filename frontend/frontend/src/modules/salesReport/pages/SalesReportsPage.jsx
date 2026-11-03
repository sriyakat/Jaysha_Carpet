import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminModuleLayout from '../../shared/components/AdminModuleLayout.jsx'
import '../shared/AdminModulePage.css'
import { getBestSellingProducts, getLowStockProducts, getPendingReportOrders, getRecentReportOrders, getReportSummary, getRevenueTrend, updateLowStockThreshold } from '../api/adminSalesReportApi.js'

function value(item, ...keys) {
  for (const key of keys) if (item?.[key] !== undefined && item?.[key] !== null) return item[key]
  return ''
}

function money(amount) {
  const number = Number(amount)
  return Number.isFinite(number) ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(number) : '—'
}

function asDateInput(date) {
  return date.toISOString().slice(0, 10)
}

function downloadCsv(filename, rows) {
  if (!rows.length) return
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))]
  const escape = (field) => `"${String(field ?? '').replaceAll('"', '""')}"`
  const contents = [headers, ...rows.map((row) => headers.map((header) => row[header]))].map((row) => row.map(escape).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([contents], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function SalesReportsPage({ user, onLogout, onNavigate }) {
  const [dates, setDates] = useState(() => {
    const initialTo = new Date()
    const initialFrom = new Date(initialTo)
    initialFrom.setDate(initialFrom.getDate() - 29)
    return { fromDate: asDateInput(initialFrom), toDate: asDateInput(initialTo) }
  })
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [pendingOrders, setPendingOrders] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [threshold, setThreshold] = useState('5')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    const results = await Promise.allSettled([
      getReportSummary(dates),
      getRevenueTrend(dates),
      getBestSellingProducts(dates),
      getLowStockProducts(),
      getPendingReportOrders(dates),
      getRecentReportOrders(),
    ])
    const setters = [setSummary, setTrend, setBestSellers, setLowStock, setPendingOrders, setRecentOrders]
    const errors = []
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') setters[index](result.value)
      else errors.push(result.reason.message)
    })
    if (errors.length) setError(errors.join(' · '))
    setLoading(false)
  }, [dates])

  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (active) load()
    })
    return () => { active = false }
  }, [load])

  const maxRevenue = Math.max(1, ...trend.map((item) => Number(value(item, 'Revenue', 'revenue', 'TotalRevenue', 'totalRevenue') || 0)))
  const summaryCards = useMemo(() => summary ? [
    ['Revenue', money(value(summary, 'TotalRevenue', 'totalRevenue', 'Revenue', 'revenue'))],
    ['Orders', value(summary, 'TotalOrders', 'totalOrders', 'OrderCount', 'orderCount') || '0'],
    ['Average order value', money(value(summary, 'AverageOrderValue', 'averageOrderValue'))],
    ['Pending orders', value(summary, 'PendingOrders', 'pendingOrders') || pendingOrders.length],
  ] : [], [summary, pendingOrders.length])

  async function saveThreshold(event) {
    event.preventDefault()
    setSaving(true)
    setNotice('')
    setError('')
    try {
      await updateLowStockThreshold(threshold)
      setNotice('Low-stock alert threshold saved.')
      setLoading(true)
      setError('')
      await load()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  function updateDateRange(field, value) {
    setDates((current) => ({ ...current, [field]: value }))
    setLoading(true)
    setError('')
  }

  function refreshReports() {
    setLoading(true)
    setError('')
    load()
  }

  return (
    <AdminModuleLayout activeModule="reports" title="Sales reports" user={user} onLogout={onLogout} onNavigate={onNavigate}>
      <section className="page-content module-page">
        <div className="module-heading"><div><p className="module-eyebrow">STORE PERFORMANCE</p><h1>Sales reports</h1><p>Revenue, orders, stock risk, and product performance in one view.</p></div><button className="module-button" disabled={loading} onClick={() => downloadCsv('jaysha-sales-report.csv', [...trend, ...bestSellers])} type="button">Export report CSV</button></div>
        <div className="module-toolbar"><div className="module-toolbar-group"><label className="module-field">From<input className="module-input module-filter" max={dates.toDate} onChange={(event) => updateDateRange('fromDate', event.target.value)} type="date" value={dates.fromDate} /></label><label className="module-field">To<input className="module-input module-filter" min={dates.fromDate} onChange={(event) => updateDateRange('toDate', event.target.value)} type="date" value={dates.toDate} /></label></div><button className="module-button" disabled={loading} onClick={refreshReports} type="button">{loading ? 'Updating…' : 'Refresh reports'}</button></div>
        {error && <p className="module-alert" role="alert">{error}</p>}{notice && <p className="module-alert module-success" role="status">{notice}</p>}
        <div className="report-stat-grid">{summaryCards.map(([label, amount]) => <article className="report-stat-card" key={label}><span>{label}</span><strong>{loading ? '—' : amount}</strong></article>)}</div>
        <section className="module-panel"><div className="module-panel-heading"><h2>Revenue trend</h2><span>{trend.length} periods</span></div>{loading ? <div className="module-state">Loading revenue data…</div> : trend.length === 0 ? <div className="module-state">No revenue data for this period.</div> : <div className="report-chart">{trend.map((item, index) => {
          const revenue = Number(value(item, 'Revenue', 'revenue', 'TotalRevenue', 'totalRevenue') || 0)
          const label = value(item, 'Period', 'period', 'ReportDate', 'reportDate', 'Date', 'date') || `Period ${index + 1}`
          return <div className="report-chart-column" key={`${label}-${index}`} title={`${label}: ${money(revenue)}`}><strong>{money(revenue)}</strong><span className="report-chart-bar" style={{ height: `${Math.max(4, revenue / maxRevenue * 100)}%` }} /><small>{new Date(label).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</small></div>
        })}</div>}</section>
        <div className="report-two-column">
          <section className="module-panel"><div className="module-panel-heading"><h2>Best sellers</h2><span>Top products</span></div>{bestSellers.length === 0 ? <div className="module-state">No product sales in this period.</div> : <div className="module-table-wrap"><table className="module-table"><thead><tr><th>Product</th><th>Units</th><th>Revenue</th></tr></thead><tbody>{bestSellers.map((item, index) => <tr key={value(item, 'ProductId', 'productId', index)}><td><strong>{value(item, 'ProductName', 'productName', 'Product')}</strong><span className="muted">{value(item, 'SKU', 'sku')}</span></td><td>{value(item, 'UnitsSold', 'unitsSold', 'QuantitySold', 'quantitySold')}</td><td>{money(value(item, 'Revenue', 'revenue', 'TotalRevenue', 'totalRevenue'))}</td></tr>)}</tbody></table></div>}</section>
          <section className="module-panel"><div className="module-panel-heading"><h2>Low stock</h2><span>{lowStock.length} products</span></div><form className="report-threshold" onSubmit={saveThreshold}><label className="module-field">Alert at or below<input className="module-input" min="0" onChange={(event) => setThreshold(event.target.value)} type="number" value={threshold} /></label><button className="module-button" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save threshold'}</button></form>{lowStock.length === 0 ? <div className="module-state">No low-stock products reported.</div> : <div className="module-table-wrap"><table className="module-table"><thead><tr><th>Product</th><th>Stock</th></tr></thead><tbody>{lowStock.map((item, index) => <tr key={value(item, 'ProductId', 'productId', index)}><td><strong>{value(item, 'ProductName', 'productName', 'Product')}</strong><span className="muted">{value(item, 'SKU', 'sku')}</span></td><td>{value(item, 'StockQuantity', 'stockQuantity', 'CurrentStock', 'currentStock')}</td></tr>)}</tbody></table></div>}</section>
        </div>
        <div className="report-two-column">
          <ReportOrders title="Pending orders" rows={pendingOrders} />
          <ReportOrders title="Recent orders" rows={recentOrders} />
        </div>
      </section>
    </AdminModuleLayout>
  )
}

function ReportOrders({ title, rows }) {
  return <section className="module-panel"><div className="module-panel-heading"><h2>{title}</h2><span>{rows.length} orders</span></div>{rows.length === 0 ? <div className="module-state">No orders to show.</div> : <div className="module-table-wrap"><table className="module-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th></tr></thead><tbody>{rows.map((item, index) => <tr key={value(item, 'OrderId', 'orderId', index)}><td><strong>{value(item, 'OrderNumber', 'orderNumber', `#${value(item, 'OrderId', 'orderId')}`)}</strong><span className="muted">{value(item, 'OrderStatus', 'orderStatus')}</span></td><td>{value(item, 'CustomerName', 'customerName', '—')}</td><td>{money(value(item, 'GrandTotal', 'grandTotal', 'TotalAmount', 'totalAmount'))}</td></tr>)}</tbody></table></div>}</section>
}

export default SalesReportsPage
