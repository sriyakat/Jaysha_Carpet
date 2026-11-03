import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminModuleLayout from '../../shared/components/AdminModuleLayout.jsx'
import '../shared/AdminModulePage.css'
import { getAdminCustomer, getAdminCustomers } from '../api/adminCustomerApi.js'

function value(item, camel, pascal, fallback = '') {
  return item?.[camel] ?? item?.[pascal] ?? fallback
}

function AdminCustomersPage({ user, onLogout, onNavigate }) {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setCustomers(await getAdminCustomers())
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    getAdminCustomers().then((items) => {
      if (active) setCustomers(items)
    }).catch((loadError) => {
      if (active) setError(loadError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return customers.filter((customer) => `${value(customer, 'fullName', 'FullName')} ${value(customer, 'email', 'Email')} ${value(customer, 'mobileNumber', 'MobileNumber')}`.toLowerCase().includes(query))
  }, [customers, search])

  async function viewDetails(customer) {
    setSelected(null)
    setDetailLoading(true)
    setError('')
    try {
      const id = value(customer, 'customerId', 'CustomerId')
      setSelected(await getAdminCustomer(id))
    } catch (detailError) {
      setError(detailError.message)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <AdminModuleLayout activeModule="customers" title="Customers" user={user} onLogout={onLogout} onNavigate={onNavigate}>
      <section className="page-content module-page">
        <div className="module-heading"><div><p className="module-eyebrow">CUSTOMER DIRECTORY</p><h1>Customers</h1><p>Find customer accounts and review their profile details.</p></div></div>
        <div className="module-toolbar"><input aria-label="Search customers" className="module-input module-filter" onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or mobile" type="search" value={search} /><button className="module-button" onClick={load} type="button">Refresh</button></div>
        {error && <p className="module-alert" role="alert">{error}</p>}
        <section className="module-panel"><div className="module-panel-heading"><h2>Customer accounts</h2><span>{visible.length} customers</span></div>
          {loading ? <div className="module-state">Loading customers…</div> : visible.length === 0 ? <div className="module-state">No matching customers found.</div> : <div className="module-table-wrap"><table className="module-table"><thead><tr><th>Customer</th><th>Contact</th><th>Joined</th><th>Orders</th><th>Actions</th></tr></thead><tbody>
            {visible.map((customer, index) => <tr key={value(customer, 'customerId', 'CustomerId', index)}><td><strong>{value(customer, 'fullName', 'FullName', 'Customer')}</strong><span className="muted">ID {value(customer, 'customerId', 'CustomerId')}</span></td><td>{value(customer, 'email', 'Email', '—')}<span className="muted">{value(customer, 'mobileNumber', 'MobileNumber')}</span></td><td>{value(customer, 'createdAt', 'CreatedAt') ? new Date(value(customer, 'createdAt', 'CreatedAt')).toLocaleDateString('en-IN') : '—'}</td><td>{value(customer, 'totalOrders', 'TotalOrders', '—')}</td><td><button className="module-button" onClick={() => viewDetails(customer)} type="button">View profile</button></td></tr>)}
          </tbody></table></div>}
        </section>
        {detailLoading && <div className="module-modal-backdrop"><section className="module-modal"><div className="module-state">Loading customer profile…</div></section></div>}
        {selected && <div className="module-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}><section aria-labelledby="customer-detail-title" aria-modal="true" className="module-modal customer-detail-modal" role="dialog"><div className="module-panel-heading"><h2 id="customer-detail-title">Customer profile</h2><button className="module-button" onClick={() => setSelected(null)} type="button">Close</button></div><div className="customer-detail-grid">{Object.entries(selected).map(([key, data]) => <div key={key}><span>{key.replace(/[A-Z]/g, (letter) => ` ${letter}`).trim()}</span><strong>{data == null || data === '' ? '—' : String(data)}</strong></div>)}</div></section></div>}
      </section>
    </AdminModuleLayout>
  )
}

export default AdminCustomersPage
