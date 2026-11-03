import { useCallback, useEffect, useState } from 'react'
import AdminModuleLayout from '../../shared/components/AdminModuleLayout.jsx'
import '../shared/AdminModulePage.css'
import { createCoupon, deleteCoupon, getCouponUsage, getCoupons, setCouponActive, updateCoupon } from '../api/adminCouponApi.js'

function value(item, camel, pascal, fallback = '') {
  return item?.[camel] ?? item?.[pascal] ?? fallback
}

function localDateTime(valueToFormat) {
  if (!valueToFormat) return ''
  const date = new Date(valueToFormat)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function defaultCoupon() {
  const start = new Date()
  const end = new Date()
  end.setMonth(end.getMonth() + 1)
  return {
    couponCode: '', description: '', discountType: 'PERCENTAGE', discountValue: '',
    maxDiscountAmount: '', minOrderAmount: '0',
    startDate: localDateTime(start), endDate: localDateTime(end),
    usageLimit: '', usagePerCustomer: '1', isActive: true,
  }
}

function CouponsPage({ user, onLogout, onNavigate }) {
  const [coupons, setCoupons] = useState([])
  const [form, setForm] = useState(defaultCoupon)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setCoupons(await getCoupons())
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    getCoupons().then((items) => {
      if (active) setCoupons(items)
    }).catch((loadError) => {
      if (active) setError(loadError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  function startCreate() {
    setEditing(null)
    setForm(defaultCoupon())
    setFormError('')
    setShowForm(true)
  }

  function startEdit(coupon) {
    setEditing(coupon)
    setForm({
      couponCode: value(coupon, 'couponCode', 'CouponCode'),
      description: value(coupon, 'description', 'Description'),
      discountType: value(coupon, 'discountType', 'DiscountType', 'PERCENTAGE'),
      discountValue: String(value(coupon, 'discountValue', 'DiscountValue')),
      maxDiscountAmount: value(coupon, 'maxDiscountAmount', 'MaxDiscountAmount') == null ? '' : String(value(coupon, 'maxDiscountAmount', 'MaxDiscountAmount')),
      minOrderAmount: String(value(coupon, 'minOrderAmount', 'MinOrderAmount', 0)),
      startDate: localDateTime(value(coupon, 'startDate', 'StartDate')),
      endDate: localDateTime(value(coupon, 'endDate', 'EndDate')),
      usageLimit: value(coupon, 'usageLimit', 'UsageLimit') == null ? '' : String(value(coupon, 'usageLimit', 'UsageLimit')),
      usagePerCustomer: String(value(coupon, 'usagePerCustomer', 'UsagePerCustomer', 1)),
      isActive: value(coupon, 'isActive', 'IsActive', true) === true || value(coupon, 'isActive', 'IsActive') === 1,
    })
    setFormError('')
    setShowForm(true)
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    const data = {
      ...form,
      couponCode: form.couponCode.trim().toUpperCase(),
      discountValue: Number(form.discountValue),
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      minOrderAmount: Number(form.minOrderAmount),
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      usagePerCustomer: Number(form.usagePerCustomer),
    }
    try {
      if (editing) await updateCoupon(value(editing, 'couponId', 'CouponId'), data)
      else await createCoupon(data)
      setShowForm(false)
      await load()
    } catch (saveError) {
      setFormError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(coupon) {
    const active = value(coupon, 'isActive', 'IsActive', false) === true || value(coupon, 'isActive', 'IsActive') === 1
    try {
      await setCouponActive(value(coupon, 'couponId', 'CouponId'), !active)
      await load()
    } catch (actionError) {
      setError(actionError.message)
    }
  }

  async function remove(coupon) {
    if (!window.confirm(`Delete coupon ${value(coupon, 'couponCode', 'CouponCode')}?`)) return
    try {
      await deleteCoupon(value(coupon, 'couponId', 'CouponId'))
      await load()
    } catch (actionError) {
      setError(actionError.message)
    }
  }

  async function showUsage(coupon) {
    setUsage({ title: value(coupon, 'couponCode', 'CouponCode'), loading: true, rows: [], error: '' })
    try {
      const rows = await getCouponUsage(value(coupon, 'couponId', 'CouponId'))
      setUsage({ title: value(coupon, 'couponCode', 'CouponCode'), loading: false, rows, error: '' })
    } catch (usageError) {
      setUsage({ title: value(coupon, 'couponCode', 'CouponCode'), loading: false, rows: [], error: usageError.message })
    }
  }

  return (
    <AdminModuleLayout activeModule="coupons" title="Coupons" user={user} onLogout={onLogout} onNavigate={onNavigate}>
      <section className="page-content module-page">
        <div className="module-heading"><div><p className="module-eyebrow">PROMOTIONS</p><h1>Coupons & offers</h1><p>Create discount codes, control usage, and check redemption history.</p></div><button className="module-button primary" onClick={startCreate} type="button">Create coupon</button></div>
        {showForm && <section className="module-form-panel"><h2>{editing ? 'Edit coupon' : 'New coupon'}</h2>{formError && <p className="module-alert" role="alert">{formError}</p>}
          <form className="module-form" onSubmit={submit}>
            <label className="module-field">Coupon code<input className="module-input" maxLength="50" onChange={(event) => setForm({ ...form, couponCode: event.target.value.toUpperCase() })} required value={form.couponCode} /></label>
            <label className="module-field">Discount type<select className="module-select" onChange={(event) => setForm({ ...form, discountType: event.target.value })} value={form.discountType}><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed amount</option></select></label>
            <label className="module-field">{form.discountType === 'PERCENTAGE' ? 'Discount (%)' : 'Discount (₹)'}<input className="module-input" min="0.01" onChange={(event) => setForm({ ...form, discountValue: event.target.value })} required step="0.01" type="number" value={form.discountValue} /></label>
            <label className="module-field">Maximum discount (₹, optional)<input className="module-input" min="0.01" onChange={(event) => setForm({ ...form, maxDiscountAmount: event.target.value })} step="0.01" type="number" value={form.maxDiscountAmount} /></label>
            <label className="module-field">Minimum order (₹)<input className="module-input" min="0" onChange={(event) => setForm({ ...form, minOrderAmount: event.target.value })} required step="0.01" type="number" value={form.minOrderAmount} /></label>
            <label className="module-field">Total usage limit<input className="module-input" min="1" onChange={(event) => setForm({ ...form, usageLimit: event.target.value })} placeholder="Unlimited" type="number" value={form.usageLimit} /></label>
            <label className="module-field">Uses per customer<input className="module-input" min="1" onChange={(event) => setForm({ ...form, usagePerCustomer: event.target.value })} required type="number" value={form.usagePerCustomer} /></label>
            <label className="module-field">Starts at<input className="module-input" onChange={(event) => setForm({ ...form, startDate: event.target.value })} required type="datetime-local" value={form.startDate} /></label>
            <label className="module-field">Ends at<input className="module-input" onChange={(event) => setForm({ ...form, endDate: event.target.value })} required type="datetime-local" value={form.endDate} /></label>
            <label className="module-field wide">Description<input className="module-input" maxLength="250" onChange={(event) => setForm({ ...form, description: event.target.value })} value={form.description} /></label>
            <label className="module-checkbox"><input checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} type="checkbox" />Active</label>
            <div className="module-form-actions"><button className="module-button" disabled={saving} onClick={() => setShowForm(false)} type="button">Cancel</button><button className="module-button primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save coupon'}</button></div>
          </form>
        </section>}
        <section className="module-panel"><div className="module-panel-heading"><h2>Discount codes</h2><span>{coupons.length} coupons</span></div>
          {error && <div className="module-state error" role="alert">{error}</div>}
          {loading ? <div className="module-state">Loading coupons…</div> : coupons.length === 0 ? <div className="module-state">No coupons created yet.</div> : <div className="module-table-wrap"><table className="module-table"><thead><tr><th>Code</th><th>Offer</th><th>Validity</th><th>Usage</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {coupons.map((coupon) => {
              const id = value(coupon, 'couponId', 'CouponId')
              const active = value(coupon, 'isActive', 'IsActive', false) === true || value(coupon, 'isActive', 'IsActive') === 1
              const discountType = value(coupon, 'discountType', 'DiscountType')
              const discount = discountType === 'PERCENTAGE' ? `${value(coupon, 'discountValue', 'DiscountValue')}%` : `₹${value(coupon, 'discountValue', 'DiscountValue')}`
              return <tr key={id}><td><strong>{value(coupon, 'couponCode', 'CouponCode')}</strong><span className="muted">{value(coupon, 'description', 'Description')}</span></td><td><strong>{discount} off</strong><span className="muted">Min. ₹{value(coupon, 'minOrderAmount', 'MinOrderAmount', 0)}</span></td><td>{new Date(value(coupon, 'startDate', 'StartDate')).toLocaleDateString('en-IN')}<span className="muted">to {new Date(value(coupon, 'endDate', 'EndDate')).toLocaleDateString('en-IN')}</span></td><td>{value(coupon, 'usedCount', 'UsedCount', '—')} / {value(coupon, 'usageLimit', 'UsageLimit', '∞')}</td><td>{active ? 'Active' : 'Inactive'}</td><td><div className="module-row-actions"><button className="module-button" onClick={() => startEdit(coupon)} type="button">Edit</button><button className="module-button" onClick={() => toggleActive(coupon)} type="button">{active ? 'Pause' : 'Activate'}</button><button className="module-button" onClick={() => showUsage(coupon)} type="button">Usage</button><button className="module-button danger" onClick={() => remove(coupon)} type="button">Delete</button></div></td></tr>
            })}
          </tbody></table></div>}
        </section>
        {usage && <div className="module-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setUsage(null) }}><section aria-labelledby="usage-title" aria-modal="true" className="module-modal" role="dialog"><div className="module-panel-heading"><h2 id="usage-title">Usage · {usage.title}</h2><button className="module-button" onClick={() => setUsage(null)} type="button">Close</button></div>{usage.loading ? <div className="module-state">Loading redemption history…</div> : usage.error ? <div className="module-state error">{usage.error}</div> : usage.rows.length === 0 ? <div className="module-state">No redemptions found.</div> : <div className="module-table-wrap"><table className="module-table"><thead><tr>{Object.keys(usage.rows[0]).slice(0, 5).map((key) => <th key={key}>{key.replace(/[A-Z]/g, (letter) => ` ${letter}`).trim()}</th>)}</tr></thead><tbody>{usage.rows.map((row, index) => <tr key={index}>{Object.keys(usage.rows[0]).slice(0, 5).map((key) => <td key={key}>{String(row[key] ?? '—')}</td>)}</tr>)}</tbody></table></div>}</section></div>}
      </section>
    </AdminModuleLayout>
  )
}

export default CouponsPage
