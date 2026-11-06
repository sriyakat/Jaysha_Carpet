import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from '../../category/components/Icon.jsx'
import AdminModuleLayout from '../../shared/components/AdminModuleLayout.jsx'
import { createInventoryTransaction, getInventoryProducts, getInventoryTransactions } from '../api/adminInventoryApi.js'
import './InventoryPage.css'

function field(item, camelName, pascalName, fallback = '') {
  return item?.[camelName] ?? item?.[pascalName] ?? fallback
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

async function fetchInventorySnapshot() {
  const [transactionsResult, productsResult] = await Promise.allSettled([
    getInventoryTransactions(),
    getInventoryProducts(),
  ])
  const transactions = transactionsResult.status === 'fulfilled' ? transactionsResult.value : []
  const products = productsResult.status === 'fulfilled' ? productsResult.value : []
  const todayKey = new Date().toDateString()
  return {
    transactions,
    products,
    todayMovements: transactions.filter((item) => new Date(field(item, 'createdAt', 'CreatedAt', 0)).toDateString() === todayKey).length,
    error: transactionsResult.status === 'rejected'
      ? transactionsResult.reason.message
      : productsResult.status === 'rejected' ? `Products load nahi ho sake: ${productsResult.reason.message}` : '',
  }
}

const ACTIONS = {
  STOCK_IN: { label: 'Stock in', title: 'Add stock', description: 'Record newly received inventory.', sign: '+', tone: 'in' },
  STOCK_OUT: { label: 'Stock out', title: 'Remove stock', description: 'Record stock removed from your store.', sign: '−', tone: 'out' },
  ADJUSTMENT: { label: 'Adjustment', title: 'Adjust stock', description: 'Set the verified physical stock count.', sign: '↔', tone: 'adjustment' },
}

function InventoryPage({ user, onLogout, onNavigate }) {
  const [transactions, setTransactions] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [actionError, setActionError] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [todayMovements, setTodayMovements] = useState(0)
  const [modalAction, setModalAction] = useState('')
  const [form, setForm] = useState({ ProductId: '', Quantity: '', OrderId: '', Remarks: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setListError('')
    try {
      const snapshot = await fetchInventorySnapshot()
      setTransactions(snapshot.transactions)
      setProducts(snapshot.products)
      setTodayMovements(snapshot.todayMovements)
      setListError(snapshot.error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    fetchInventorySnapshot()
      .then((snapshot) => {
        if (!active) return
        setTransactions(snapshot.transactions)
        setProducts(snapshot.products)
        setTodayMovements(snapshot.todayMovements)
        setListError(snapshot.error)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const visibleTransactions = useMemo(() => {
    const query = search.trim().toLowerCase()
    return transactions.filter((item) => {
      const productName = field(item, 'productName', 'ProductName')
      const sku = field(item, 'sku', 'SKU')
      const orderNumber = field(item, 'orderNumber', 'OrderNumber')
      const type = String(field(item, 'transactionType', 'TransactionType')).toUpperCase()
      const matchesSearch = `${productName} ${sku} ${orderNumber} ${field(item, 'remarks', 'Remarks')}`.toLowerCase().includes(query)
      return matchesSearch && (!typeFilter || type === typeFilter)
    })
  }, [transactions, search, typeFilter])

  const lowStockProducts = products.filter((product) => Number(field(product, 'stockQuantity', 'StockQuantity', 0)) <= 5)
  const totalUnits = products.reduce((sum, product) => sum + Number(field(product, 'stockQuantity', 'StockQuantity', 0)), 0)
  function openAction(action) {
    setModalAction(action)
    setForm({ ProductId: products[0] ? String(field(products[0], 'productId', 'ProductId')) : '', Quantity: '', OrderId: '', Remarks: '' })
    setFormError('')
    setActionError('')
  }

  async function submitAction(event) {
    event.preventDefault()
    if (!modalAction) return
    const quantity = Number(form.Quantity)
    if (!Number.isSafeInteger(quantity) || quantity < (modalAction === 'ADJUSTMENT' ? 0 : 1)) {
      setFormError(modalAction === 'ADJUSTMENT' ? 'Stock quantity zero ya usse zyada honi chahiye.' : 'Quantity kam se kam 1 honi chahiye.')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      await createInventoryTransaction(modalAction, {
        ProductId: Number(form.ProductId),
        Quantity: quantity,
        ...(modalAction === 'STOCK_OUT' && form.OrderId ? { OrderId: Number(form.OrderId) } : {}),
        ...(form.Remarks.trim() ? { Remarks: form.Remarks.trim() } : {}),
      })
      setModalAction('')
      await loadData()
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminModuleLayout activeModule="inventory" title="Inventory" user={user} onLogout={onLogout} onNavigate={onNavigate}>
        <div className="page-content">
          <div className="page-heading inventory-heading">
            <div><p className="eyebrow"><span className="eyebrow-dot" /> Stock control</p><h1>Inventory</h1><p>Stock levels aur har movement ka clear record rakhein.</p></div>
            <div className="inventory-heading-actions"><button className="secondary-button" disabled={loading} onClick={loadData} type="button">Refresh</button><button className="primary-button" onClick={() => openAction('STOCK_IN')} type="button"><Icon name="plus" size={17} />Add stock</button></div>
            <div aria-hidden="true" className="hero-ornament"><span className="ornament-ring ring-one" /><span className="ornament-ring ring-two" /><span className="ornament-center"><Icon name="box" size={30} /></span></div>
          </div>
          {actionError && <div className="page-error" role="alert"><Icon name="warning" size={17} /><span>{actionError}</span></div>}

          <div className="overview-grid">
            <article className="overview-card"><span className="overview-icon"><Icon name="box" size={20} /></span><div><p className="overview-label">Products tracked</p><p className="overview-value">{loading ? '—' : products.length}</p></div></article>
            <article className="overview-card"><span className="overview-icon inventory-low-icon"><Icon name="warning" size={20} /></span><div><p className="overview-label">Low stock · 5 or fewer</p><p className="overview-value">{loading ? '—' : lowStockProducts.length}</p></div></article>
            <article className="overview-card"><span className="overview-icon"><Icon name="sparkle" size={20} /></span><div><p className="overview-label">Units in stock</p><p className="overview-value">{loading ? '—' : totalUnits.toLocaleString('en-IN')}</p></div></article>
            <article className="overview-card"><span className="overview-icon"><Icon name="category" size={20} /></span><div><p className="overview-label">Movements today</p><p className="overview-value">{loading ? '—' : todayMovements}</p></div></article>
          </div>

          <section className="inventory-stock-section">
            <div className="inventory-section-heading"><div><h2>Stock overview</h2><p>Products currently at or below five units are highlighted.</p></div><button className="secondary-button" onClick={() => onNavigate('products')} type="button">Manage products</button></div>
            {products.length === 0 && !loading ? <p className="inventory-stock-empty">Product stock overview load nahi ho saka.</p> : (
              <div className="inventory-stock-grid">
                {products.slice(0, 6).map((product, index) => {
                  const quantity = Number(field(product, 'stockQuantity', 'StockQuantity', 0))
                  return <article className={`inventory-stock-card ${quantity <= 5 ? 'is-low-stock' : ''}`} key={field(product, 'productId', 'ProductId', index)}><span className={`inventory-product-mark inventory-mark-${index % 4}`}><Icon name="box" size={18} /></span><div className="inventory-stock-info"><strong>{field(product, 'productName', 'ProductName', 'Untitled product')}</strong><span>{field(product, 'sku', 'SKU', 'No SKU')}</span></div><div className="inventory-stock-quantity"><strong>{quantity}</strong><span>units</span></div></article>
                })}
                {products.length > 6 && <button className="inventory-more-card" onClick={() => onNavigate('products')} type="button">View all {products.length} products <span>→</span></button>}
              </div>
            )}
          </section>

          <section aria-label="Inventory transaction history" className="table-card inventory-transactions">
            <div className="table-toolbar"><div><h2 className="table-title">Stock movement history</h2><p className="table-subtitle">{visibleTransactions.length} transactions shown</p></div><div className="inventory-filters"><label className="search-box"><Icon name="search" size={16} /><input aria-label="Search inventory history" onChange={(event) => setSearch(event.target.value)} placeholder="Search product, SKU..." type="search" value={search} /></label><select aria-label="Filter inventory movement" className="inventory-select" onChange={(event) => setTypeFilter(event.target.value)} value={typeFilter}><option value="">All movements</option><option value="STOCK_IN">Stock in</option><option value="STOCK_OUT">Stock out</option><option value="ADJUSTMENT">Adjustment</option></select></div></div>
            <div className="inventory-quick-actions"><button className="inventory-action-card action-in" onClick={() => openAction('STOCK_IN')} type="button"><span>＋</span><div><strong>Stock in</strong><small>Record received units</small></div><Icon name="arrow" size={16} /></button><button className="inventory-action-card action-out" onClick={() => openAction('STOCK_OUT')} type="button"><span>−</span><div><strong>Stock out</strong><small>Record removed units</small></div><Icon name="arrow" size={16} /></button><button className="inventory-action-card action-adjust" onClick={() => openAction('ADJUSTMENT')} type="button"><span>↔</span><div><strong>Adjustment</strong><small>Set verified stock count</small></div><Icon name="arrow" size={16} /></button></div>
            {loading ? <div aria-live="polite" className="loading-state"><span className="spinner" /><span>Inventory load ho rahi hai...</span></div>
              : listError ? <div className="empty-state" role="alert"><span className="overview-icon"><Icon name="warning" size={21} /></span><h3>Inventory load nahi ho saki</h3><p>{listError}</p><button className="secondary-button" onClick={loadData} type="button">Retry</button></div>
                : visibleTransactions.length === 0 ? <div className="empty-state"><span className="overview-icon"><Icon name="box" size={21} /></span><h3>{transactions.length ? 'Koi matching movement nahi mila' : 'Abhi movement history nahi hai'}</h3><p>Stock in, stock out ya adjustment record karte hi history yahan dikhegi.</p></div>
                  : <div className="table-scroll"><table className="category-table inventory-table"><thead><tr><th>Product</th><th>Movement</th><th>Quantity</th><th>Stock change</th><th>Reference</th><th>Updated by</th><th>Date</th></tr></thead><tbody>{visibleTransactions.map((transaction, index) => {
                    const type = String(field(transaction, 'transactionType', 'TransactionType', 'ADJUSTMENT')).toUpperCase()
                    const tone = type === 'STOCK_IN' ? 'in' : type === 'STOCK_OUT' ? 'out' : 'adjustment'
                    return <tr key={field(transaction, 'inventoryTransactionId', 'InventoryTransactionId', index)}><td><strong className="inventory-product-name">{field(transaction, 'productName', 'ProductName', 'Product')}</strong><span className="inventory-cell-muted">{field(transaction, 'sku', 'SKU', '—')}</span></td><td><span className={`inventory-type-badge ${tone}`}>{ACTIONS[type]?.label || type.replace('_', ' ')}</span></td><td><strong className={`inventory-quantity ${tone}`}>{ACTIONS[type]?.sign || ''}{field(transaction, 'quantity', 'Quantity', 0)}</strong></td><td><span>{field(transaction, 'previousStock', 'PreviousStock', '—')}</span><span className="inventory-stock-arrow">→</span><strong>{field(transaction, 'newStock', 'NewStock', '—')}</strong></td><td>{field(transaction, 'orderNumber', 'OrderNumber') || field(transaction, 'remarks', 'Remarks') || '—'}</td><td>{field(transaction, 'createdByName', 'CreatedByName', 'Admin')}</td><td>{formatDate(field(transaction, 'createdAt', 'CreatedAt'))}</td></tr>
                  })}</tbody></table></div>}
          </section>
        </div>

      {modalAction && <div className="inventory-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setModalAction('') }}><section aria-labelledby="inventory-modal-title" aria-modal="true" className="inventory-modal" role="dialog"><header className="inventory-modal-header"><span className={`inventory-modal-icon ${ACTIONS[modalAction].tone}`}>{ACTIONS[modalAction].sign}</span><div><p className="eyebrow">Inventory update</p><h2 id="inventory-modal-title">{ACTIONS[modalAction].title}</h2><p>{ACTIONS[modalAction].description}</p></div><button aria-label="Close inventory form" className="inventory-close-button" disabled={saving} onClick={() => setModalAction('')} type="button"><Icon name="close" size={19} /></button></header><form className="inventory-modal-form" onSubmit={submitAction}>{formError && <div className="page-error" role="alert"><Icon name="warning" size={16} /><span>{formError}</span></div>}<label>Product<select onChange={(event) => setForm((current) => ({ ...current, ProductId: event.target.value }))} required value={form.ProductId}><option value="">Choose product</option>{products.map((product) => <option key={field(product, 'productId', 'ProductId')} value={field(product, 'productId', 'ProductId')}>{field(product, 'productName', 'ProductName')} · {field(product, 'sku', 'SKU', 'No SKU')} · {field(product, 'stockQuantity', 'StockQuantity', 0)} in stock</option>)}</select></label><label>{modalAction === 'ADJUSTMENT' ? 'New verified stock quantity' : 'Quantity'}<input min={modalAction === 'ADJUSTMENT' ? 0 : 1} onChange={(event) => setForm((current) => ({ ...current, Quantity: event.target.value }))} required type="number" value={form.Quantity} /></label>{modalAction === 'STOCK_OUT' && <label>Order number <span className="inventory-optional">Optional</span><input inputMode="numeric" onChange={(event) => setForm((current) => ({ ...current, OrderId: event.target.value }))} placeholder="Linked order ID" type="number" value={form.OrderId} /></label>}<label>Note <span className="inventory-optional">Optional</span><textarea maxLength={500} onChange={(event) => setForm((current) => ({ ...current, Remarks: event.target.value }))} placeholder="Add a note for this stock update" rows={3} value={form.Remarks} /></label><footer><button className="secondary-button" disabled={saving} onClick={() => setModalAction('')} type="button">Cancel</button><button className="primary-button" disabled={saving || !products.length} type="submit">{saving ? 'Saving...' : `Save ${ACTIONS[modalAction].label.toLowerCase()}`}</button></footer></form></section></div>}
    </AdminModuleLayout>
  )
}

export default InventoryPage
