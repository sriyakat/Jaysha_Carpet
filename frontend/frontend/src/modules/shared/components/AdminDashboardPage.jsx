import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../../category/components/Icon.jsx'
import { getAdminCustomers } from '../../customer/api/adminCustomerApi.js'
import { getProducts } from '../../product/api/productApi.js'
import { getBestSellingProducts, getLowStockProducts, getPendingReportOrders, getRecentReportOrders, getReportSummary, getRevenueTrend } from '../../salesReport/api/adminSalesReportApi.js'
import AdminModuleLayout from './AdminModuleLayout.jsx'
import './AdminModulePage.css'

const sections = [
  { module: 'categories', title: 'Categories', description: 'Organize your carpet collections and browse structure.', icon: 'category' },
  { module: 'products', title: 'Product listing', description: 'Add products, then manage photos, sizes, stock, and videos from each listing.', icon: 'box' },
  { module: 'orders', title: 'Orders', description: 'Review customer orders and update fulfillment progress.', icon: 'box' },
  { module: 'inventory', title: 'Inventory', description: 'Monitor stock levels and record stock movements.', icon: 'box' },
  { module: 'payments', title: 'Payments', description: 'Review payment methods, collection status, and gateway data.', icon: 'sparkle' },
  { module: 'customers', title: 'Customers', description: 'Look up customer accounts and contact details.', icon: 'category' },
  { module: 'returns', title: 'Returns & refunds', description: 'Review cancellations, returns, and refund progress.', icon: 'box' },
  { module: 'coupons', title: 'Coupons & offers', description: 'Create discount codes and check their usage.', icon: 'sparkle' },
  { module: 'banners', title: 'Homepage banners', description: 'Schedule storefront promotions and hero campaigns.', icon: 'image' },
  { module: 'new-arrivals', title: 'Homepage new arrivals', description: 'Choose and arrange the products featured in New Arrivals.', icon: 'image' },
  { module: 'custom-orders', title: 'Custom carpet requests', description: 'Review custom sizes, colours and customer reference images.', icon: 'box' },
  { module: 'showcase', title: 'Homepage showcase', description: 'Add and arrange homepage showcase image or video cards.', icon: 'image' },
  { module: 'inspiration', title: 'Homepage inspiration', description: 'Manage the “Collected for considered homes” images, videos, and captions.', icon: 'image' },
  { module: 'offer', title: 'Homepage offer', description: 'Set the homepage promotion image, offer copy, and button link.', icon: 'image' },
  { module: 'reports', title: 'Sales reports', description: 'Track revenue, best sellers, pending orders, and stock risk.', icon: 'grid' },
  { module: 'reviews', title: 'Reviews', description: 'Moderate customer feedback before it appears publicly.', icon: 'sparkle' },
  { module: 'notifications', title: 'Notifications', description: 'Create and review customer order notifications.', icon: 'sparkle' },
  { module: 'settings', title: 'Website settings', description: 'Update storefront identity, contact, and social links.', icon: 'edit' },
]

const quickActions = [
  { module: 'products', title: 'Manage products', description: 'Add rugs and update listings.', icon: 'box' },
  { module: 'orders', title: 'Process orders', description: 'Review and fulfill customer orders.', icon: 'box' },
  { module: 'custom-orders', title: 'Custom requests', description: 'Review sizes, colours, and reference images.', icon: 'image' },
  { module: 'inventory', title: 'Check inventory', description: 'Review stock and replenishment needs.', icon: 'category' },
]

const sectionGroups = [
  { title: 'Products & catalog', modules: ['products', 'categories', 'variants', 'videos'] },
  { title: 'Homepage', modules: ['banners', 'new-arrivals', 'showcase', 'inspiration', 'offer'] },
  { title: 'Orders & customers', modules: ['orders', 'custom-orders', 'customers', 'returns', 'payments'] },
  { title: 'Store tools & insights', modules: ['inventory', 'coupons', 'reports', 'reviews', 'notifications', 'settings'] },
]

const monthOptions = [1, 3, 6, 12, 24]
const chartColors = ['#65835d', '#a8bd87', '#d2a66f', '#7b9ba0', '#b47c74', '#9c91b4']

function getValue(item, ...keys) {
  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null) return item[key]
  }
  return ''
}

function money(amount, compact = false) {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    ...(compact ? { notation: 'compact', compactDisplay: 'short' } : {}),
  }).format(value)
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateFilters(monthCount) {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth() - monthCount + 1, 1)
  return { fromDate: formatDate(start), toDate: formatDate(today) }
}

function dateKey(value) {
  const stringValue = String(value ?? '')
  const match = stringValue.match(/^(\d{4}-\d{2}-\d{2})/)
  if (match) return match[1]
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : formatDate(date)
}

function buildRevenueSeries(trend, filters) {
  const start = new Date(`${filters.fromDate}T00:00:00`)
  const end = new Date(`${filters.toDate}T00:00:00`)
  const dayCount = Math.floor((end - start) / 86400000) + 1
  const unit = dayCount <= 90 ? 'day' : dayCount <= 365 ? 'week' : 'month'
  const totals = new Map()

  trend.forEach((item) => {
    const key = dateKey(getValue(item, 'Period', 'period', 'ReportDate', 'reportDate', 'Date', 'date'))
    if (!key || key < filters.fromDate || key > filters.toDate) return
    const date = new Date(`${key}T00:00:00`)
    const dayOffset = Math.floor((date - start) / 86400000)
    const bucket = unit === 'day'
      ? key
      : unit === 'week'
        ? `week-${Math.floor(dayOffset / 7)}`
        : key.slice(0, 7)
    const revenue = Number(getValue(item, 'Revenue', 'revenue', 'TotalRevenue', 'totalRevenue') || 0)
    totals.set(bucket, (totals.get(bucket) || 0) + (Number.isFinite(revenue) ? revenue : 0))
  })

  const buckets = []
  if (unit === 'month') {
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
      buckets.push({
        key,
        label: cursor.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        revenue: totals.get(key) || 0,
      })
      cursor.setMonth(cursor.getMonth() + 1)
    }
    return buckets
  }

  for (let offset = 0; offset < dayCount; offset += unit === 'day' ? 1 : 7) {
    const date = new Date(start)
    date.setDate(start.getDate() + offset)
    const key = unit === 'day' ? formatDate(date) : `week-${Math.floor(offset / 7)}`
    buckets.push({
      key,
      label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      revenue: totals.get(key) || 0,
    })
  }
  return buckets
}

function RevenueLineChart({ data }) {
  const width = 760
  const height = 250
  const padding = { top: 18, right: 12, bottom: 38, left: 58 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const maxRevenue = Math.max(1, ...data.map((item) => item.revenue))
  const points = data.map((item, index) => ({
    ...item,
    x: padding.left + (data.length === 1 ? plotWidth / 2 : index * plotWidth / (data.length - 1)),
    y: padding.top + plotHeight - (item.revenue / maxRevenue) * plotHeight,
  }))
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')
  const labelStep = Math.max(1, Math.ceil(data.length / 12))

  return (
    <div className="dashboard-line-chart">
      <svg aria-label="Revenue trend chart" className="dashboard-chart-svg" role="img" viewBox={`0 0 ${width} ${height}`}>
        {[0, 1, 2, 3].map((step) => {
          const y = padding.top + step * plotHeight / 3
          return (
            <g key={step}>
              <line className="dashboard-chart-gridline" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
              <text className="dashboard-chart-axis-label" textAnchor="end" x={padding.left - 8} y={y + 4}>
                {money(maxRevenue * (1 - step / 3), true)}
              </text>
            </g>
          )
        })}
        <path className="dashboard-revenue-area" d={`${path} L ${points.at(-1)?.x ?? padding.left} ${padding.top + plotHeight} L ${points[0]?.x ?? padding.left} ${padding.top + plotHeight} Z`} />
        <path className="dashboard-revenue-line" d={path} />
        {points.map((point, index) => (
          <g key={point.key}>
            <circle className="dashboard-revenue-point" cx={point.x} cy={point.y} r={4}>
              <title>{`${point.label}: ${money(point.revenue)}`}</title>
            </circle>
            {index % labelStep === 0 && (
              <text className="dashboard-chart-month-label" textAnchor="middle" x={point.x} y={height - 10}>
                {point.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}

function RevenueDonut({ products, totalRevenue }) {
  const sorted = [...products]
    .map((item) => ({
      name: getValue(item, 'ProductName', 'productName', 'Product') || 'Product',
      revenue: Number(getValue(item, 'Revenue', 'revenue', 'TotalRevenue', 'totalRevenue') || 0),
    }))
    .filter((item) => Number.isFinite(item.revenue) && item.revenue > 0)
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 5)
  const shownRevenue = sorted.reduce((total, item) => total + item.revenue, 0)
  const otherRevenue = Math.max(0, Number(totalRevenue || 0) - shownRevenue)
  const segments = [
    ...sorted,
    ...(otherRevenue > 0 ? [{ name: 'Other sales', revenue: otherRevenue }] : []),
  ]
  const segmentTotal = segments.reduce((total, item) => total + item.revenue, 0)
  let cumulative = 0
  const gradient = segments.map((item, index) => {
    const start = cumulative
    cumulative += item.revenue / (segmentTotal || 1) * 100
    return `${chartColors[index % chartColors.length]} ${start}% ${cumulative}%`
  }).join(', ')

  if (!segments.length) return <div className="module-state">No product revenue for this period.</div>

  return (
    <div className="dashboard-donut-layout">
      <div aria-label={`Top products revenue share, ${money(segmentTotal)} total`} className="dashboard-donut" role="img" style={{ background: `conic-gradient(${gradient})` }}>
        <span><strong>{money(segmentTotal, true)}</strong><small>product revenue</small></span>
      </div>
      <ul className="dashboard-donut-legend">
        {segments.map((item, index) => (
          <li key={`${item.name}-${index}`}>
            <span className="dashboard-legend-dot" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
            <span className="dashboard-legend-name" title={item.name}>{item.name}</span>
            <strong>{money(item.revenue, true)}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProductBarChart({ products }) {
  const bestSellers = products.slice(0, 6).map((item) => ({
    name: getValue(item, 'ProductName', 'productName', 'Product') || 'Product',
    units: Number(getValue(item, 'UnitsSold', 'unitsSold', 'QuantitySold', 'quantitySold') || 0),
  }))
  const maxUnits = Math.max(1, ...bestSellers.map((item) => item.units))

  if (!bestSellers.length) return <div className="module-state">No product sales for this period.</div>

  return (
    <div className="dashboard-product-bars">
      {bestSellers.map((item, index) => (
        <div className="dashboard-product-bar-row" key={`${item.name}-${index}`} title={`${item.name}: ${item.units} units`}>
          <span>{item.name}</span>
          <div className="dashboard-product-bar-track"><i style={{ width: `${Math.max(3, item.units / maxUnits * 100)}%` }} /></div>
          <strong>{item.units}</strong>
        </div>
      ))}
    </div>
  )
}

function AdminDashboardPage({ user, onLogout, onNavigate }) {
  const [monthCount, setMonthCount] = useState(6)
  const [filters, setFilters] = useState(() => dateFilters(6))
  const [todayDate] = useState(() => formatDate(new Date()))
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [pendingOrders, setPendingOrders] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [customerCount, setCustomerCount] = useState(null)
  const [productCount, setProductCount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [supportingLoading, setSupportingLoading] = useState(true)
  const [error, setError] = useState('')
  const [supportingError, setSupportingError] = useState('')
  const requestId = useRef(0)

  function selectMonthRange(value) {
    if (value === 'custom') {
      setMonthCount(null)
      return
    }
    const months = Number(value)
    setMonthCount(months)
    setFilters(dateFilters(months))
  }

  function updateDate(field, value) {
    setMonthCount(null)
    setFilters((current) => ({ ...current, [field]: value }))
  }

  const loadOverview = useCallback(async () => {
    if (!filters.fromDate || !filters.toDate || filters.fromDate > filters.toDate) {
      setError('Please choose a valid From and To date.')
      setLoading(false)
      return
    }
    const currentRequestId = ++requestId.current
    setLoading(true)
    setError('')
    const results = await Promise.allSettled([
      getReportSummary(filters),
      getRevenueTrend(filters),
      getBestSellingProducts(filters),
      getPendingReportOrders(filters),
    ])
    if (currentRequestId !== requestId.current) return
    const setters = [setSummary, setTrend, setBestSellers, setPendingOrders]
    const errors = []
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') setters[index](result.value)
      else errors.push(result.reason?.message || 'Dashboard data load nahi ho saka.')
    })
    setError(errors.join(' · '))
    setLoading(false)
  }, [filters])

  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (active) loadOverview()
    })
    return () => {
      active = false
      requestId.current += 1
    }
  }, [loadOverview])

  useEffect(() => {
    let active = true
    Promise.allSettled([
      getRecentReportOrders(),
      getLowStockProducts(),
      getAdminCustomers(),
      getProducts(),
    ]).then((results) => {
      if (!active) return
      const setters = [setRecentOrders, setLowStockProducts, (items) => setCustomerCount(items.length), (items) => setProductCount(items.length)]
      const errors = []
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') setters[index](result.value)
        else errors.push(result.reason?.message || 'Dashboard details could not be loaded.')
      })
      setSupportingError(errors.join(' · '))
      setSupportingLoading(false)
    })
    return () => { active = false }
  }, [])

  const revenueSeries = useMemo(
    () => filters.fromDate && filters.toDate && filters.fromDate <= filters.toDate
      ? buildRevenueSeries(trend, filters)
      : [],
    [trend, filters],
  )
  const daySpan = Math.floor((new Date(`${filters.toDate}T00:00:00`) - new Date(`${filters.fromDate}T00:00:00`)) / 86400000) + 1
  const chartInterval = daySpan <= 90 ? 'daily' : daySpan <= 365 ? 'weekly' : 'monthly'
  const selectedPeriod = filters.fromDate && filters.toDate ? `${filters.fromDate} – ${filters.toDate}` : 'Select a date range'
  const revenue = getValue(summary, 'TotalRevenue', 'totalRevenue', 'Revenue', 'revenue')
  const orders = getValue(summary, 'TotalOrders', 'totalOrders', 'OrderCount', 'orderCount')
  const summaryPendingCount = getValue(summary, 'PendingOrders', 'pendingOrders')
  const pendingCount = summaryPendingCount === '' ? pendingOrders.length : summaryPendingCount
  const stats = [
    { label: 'Total revenue', value: money(revenue), icon: 'sparkle' },
    { label: 'Total orders', value: orders || '0', icon: 'box' },
    { label: 'Total customers', value: customerCount === null ? '—' : customerCount, icon: 'category' },
    { label: 'Total products', value: productCount === null ? '—' : productCount, icon: 'image' },
    { label: 'Pending orders', value: pendingCount, icon: 'warning' },
    { label: 'Low stock products', value: supportingLoading ? '—' : lowStockProducts.length, icon: 'box' },
  ]

  return (
    <AdminModuleLayout activeModule="dashboard" title="Overview" user={user} onLogout={onLogout} onNavigate={onNavigate}>
      <section className="page-content module-page dashboard-page">
        <div className="module-heading dashboard-heading">
          <div><p className="module-eyebrow">JAYSHA CARPET ADMIN</p><h1>Welcome back, {user?.fullName || user?.FullName || 'Admin'}</h1><p>Your store at a glance. Choose a task or review what needs attention.</p></div>
          <div className="dashboard-period-controls">
            <label htmlFor="dashboard-month-range">Quick range</label>
            <select className="module-select" id="dashboard-month-range" onChange={(event) => selectMonthRange(event.target.value)} value={monthCount || 'custom'}>
              {monthOptions.map((months) => <option key={months} value={months}>{months} {months === 1 ? 'month' : 'months'}</option>)}
              <option value="custom">Custom dates</option>
            </select>
            <label htmlFor="dashboard-from-date">From</label>
            <input aria-label="From date" className="module-input dashboard-date-input" id="dashboard-from-date" max={filters.toDate || undefined} onChange={(event) => updateDate('fromDate', event.target.value)} type="date" value={filters.fromDate} />
            <label htmlFor="dashboard-to-date">To</label>
            <input aria-label="To date" className="module-input dashboard-date-input" id="dashboard-to-date" max={todayDate} min={filters.fromDate || undefined} onChange={(event) => updateDate('toDate', event.target.value)} type="date" value={filters.toDate} />
            <button className="module-button" disabled={loading || !filters.fromDate || !filters.toDate || filters.fromDate > filters.toDate} onClick={loadOverview} type="button">{loading ? 'Updating…' : 'Apply dates'}</button>
          </div>
        </div>

        {error && <p className="module-alert" role="alert">{error}</p>}
        {supportingError && <p className="module-alert" role="alert">Some dashboard details could not be loaded: {supportingError}</p>}

        <section aria-labelledby="dashboard-quick-actions-title" className="dashboard-easy-actions">
          <div className="dashboard-easy-section-heading">
            <div><h2 id="dashboard-quick-actions-title">Quick actions</h2><p>Jump straight to a common task.</p></div>
          </div>
          <div className="dashboard-easy-action-grid">
            {quickActions.map((action) => (
              <button className="dashboard-easy-action" key={action.module} onClick={() => onNavigate(action.module)} type="button">
                <span className="dashboard-easy-action-icon"><Icon name={action.icon} size={18} /></span>
                <span><strong>{action.title}</strong><small>{action.description}</small></span>
                <span aria-hidden="true" className="dashboard-easy-action-arrow">→</span>
              </button>
            ))}
          </div>
        </section>

        <div className="dashboard-stat-grid">
          {stats.map((stat) => (
            <article className="dashboard-stat-card" key={stat.label}>
              <span className="dashboard-stat-icon"><Icon name={stat.icon} size={18} /></span>
              <span className="dashboard-stat-label">{stat.label}</span>
              <strong>{loading ? '—' : stat.value}</strong>
              <small>{stat.label === 'Total revenue' || stat.label === 'Total orders' ? selectedPeriod : 'Store overview'}</small>
            </article>
          ))}
        </div>

        <div className="dashboard-operations-grid">
          <section className="module-panel">
            <div className="module-panel-heading">
              <div><h2>Recent orders</h2><p>Latest activity across your store</p></div>
              <button className="module-button" onClick={() => onNavigate('orders')} type="button">View all</button>
            </div>
            {supportingLoading ? <div className="module-state">Loading recent orders…</div> : recentOrders.length === 0 ? <div className="module-state">No recent orders to show.</div> : (
              <div className="module-table-wrap">
                <table className="module-table dashboard-compact-table">
                  <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Amount</th><th>Payment</th><th>Status</th></tr></thead>
                  <tbody>{recentOrders.slice(0, 6).map((order, index) => {
                    const orderId = getValue(order, 'OrderNumber', 'orderNumber', 'OrderCode', 'orderCode', 'OrderId', 'orderId')
                    const orderStatus = getValue(order, 'OrderStatus', 'orderStatus', 'Status', 'status') || '—'
                    const paymentStatus = getValue(order, 'PaymentStatus', 'paymentStatus') || '—'
                    return (
                      <tr key={orderId || index}>
                        <td><strong>#{orderId || '—'}</strong></td>
                        <td>{getValue(order, 'CustomerName', 'customerName', 'FullName', 'fullName') || 'Customer'}</td>
                        <td>{getValue(order, 'OrderDate', 'orderDate', 'CreatedAt', 'createdAt') ? new Date(getValue(order, 'OrderDate', 'orderDate', 'CreatedAt', 'createdAt')).toLocaleDateString('en-IN') : '—'}</td>
                        <td>{money(getValue(order, 'TotalAmount', 'totalAmount', 'Amount', 'amount'))}</td>
                        <td><span className="dashboard-status-pill">{paymentStatus}</span></td>
                        <td><span className={`dashboard-status-pill ${String(orderStatus).toLowerCase().replace(/[^a-z]+/g, '-')}`}>{orderStatus}</span></td>
                      </tr>
                    )
                  })}</tbody>
                </table>
              </div>
            )}
          </section>
          <section className="module-panel">
            <div className="module-panel-heading">
              <div><h2>Low stock alerts</h2><p>Products that may need replenishment</p></div>
              <button className="module-button" onClick={() => onNavigate('inventory')} type="button">Inventory</button>
            </div>
            {supportingLoading ? <div className="module-state">Checking stock levels…</div> : lowStockProducts.length === 0 ? <div className="module-state">No low stock products reported.</div> : (
              <ul className="dashboard-low-stock-list">
                {lowStockProducts.slice(0, 6).map((product, index) => {
                  const quantity = getValue(product, 'AvailableStock', 'availableStock', 'StockQuantity', 'stockQuantity', 'Quantity', 'quantity')
                  return (
                    <li key={getValue(product, 'ProductId', 'productId') || index}>
                      <span className="dashboard-low-stock-icon"><Icon name="box" size={16} /></span>
                      <span className="dashboard-low-stock-name"><strong>{getValue(product, 'ProductName', 'productName', 'Name', 'name') || 'Product'}</strong><small>{getValue(product, 'Sku', 'sku', 'SKU') || 'Inventory item'}</small></span>
                      <span className="dashboard-stock-count"><strong>{quantity || '0'}</strong><small>left</small></span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        <section aria-labelledby="dashboard-management-title" className="dashboard-easy-management">
          <div className="dashboard-easy-section-heading">
            <div><h2 id="dashboard-management-title">Manage your store</h2><p>Everything is grouped by task, so it is easier to find.</p></div>
          </div>
          <div className="dashboard-easy-group-grid">
            {sectionGroups.map((group) => (
              <section className="dashboard-easy-group" key={group.title}>
                <h3>{group.title}</h3>
                <div className="dashboard-easy-link-list">
                  {group.modules.map((module) => {
                    const section = sections.find((item) => item.module === module)
                    if (!section) return null
                    return (
                      <button key={section.module} onClick={() => onNavigate(section.module)} type="button">
                        <Icon name={section.icon} size={16} />
                        <span>{section.title}</span>
                        <span aria-hidden="true">→</span>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>

        <details className="dashboard-easy-analytics">
          <summary><span><strong>Store performance</strong><small>Revenue trends and best-selling products · {selectedPeriod}</small></span><span className="dashboard-easy-analytics-toggle">View analytics</span></summary>
          <div className="dashboard-chart-grid">
            <section className="module-panel dashboard-revenue-panel">
              <div className="module-panel-heading"><div><h2>Revenue over time</h2><p>{chartInterval[0].toUpperCase() + chartInterval.slice(1)} revenue · {selectedPeriod}</p></div><span>{revenueSeries.length} periods</span></div>
              {loading ? <div className="module-state">Loading revenue data…</div> : revenueSeries.length ? <RevenueLineChart data={revenueSeries} /> : <div className="module-state">No revenue data for this period.</div>}
            </section>
            <section className="module-panel">
              <div className="module-panel-heading"><div><h2>Revenue by product</h2><p>Top products and remaining sales</p></div><span>Top 5</span></div>
              {loading ? <div className="module-state">Loading product data…</div> : <RevenueDonut products={bestSellers} totalRevenue={revenue} />}
            </section>
            <section className="module-panel dashboard-products-panel">
              <div className="module-panel-heading"><div><h2>Best-selling products</h2><p>Units sold in the selected period</p></div><span>Top 6</span></div>
              {loading ? <div className="module-state">Loading product data…</div> : <ProductBarChart products={bestSellers} />}
            </section>
          </div>
          <button className="module-button dashboard-easy-report-link" onClick={() => onNavigate('reports')} type="button">Open full sales reports →</button>
        </details>
      </section>
    </AdminModuleLayout>
  )
}

export default AdminDashboardPage
