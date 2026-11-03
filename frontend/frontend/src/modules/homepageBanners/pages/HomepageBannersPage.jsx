import { useCallback, useEffect, useState } from 'react'
import AdminModuleLayout from '../../shared/components/AdminModuleLayout.jsx'
import '../shared/AdminModulePage.css'
import { createHomepageBanner, deleteHomepageBanner, getHomepageBanners, setHomepageBannerActive, updateHomepageBanner } from '../api/adminHomepageBannerApi.js'

const EMPTY_BANNER = {
  Title: '', Subtitle: '', Description: '', ImageUrl: '', MobileImageUrl: '',
  ButtonText: '', ButtonUrl: '', PromotionCode: '', DisplayOrder: 0,
  StartDate: '', EndDate: '', IsActive: true,
}

function value(item, camel, pascal, fallback = '') {
  return item?.[camel] ?? item?.[pascal] ?? fallback
}

function dateTime(valueToFormat) {
  if (!valueToFormat) return ''
  const date = new Date(valueToFormat)
  return Number.isNaN(date.getTime()) ? String(valueToFormat) : date.toLocaleString('en-IN')
}

function HomepageBannersPage({ user, onLogout, onNavigate }) {
  const [banners, setBanners] = useState([])
  const [activeFilter, setActiveFilter] = useState('')
  const [form, setForm] = useState(EMPTY_BANNER)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setBanners(await getHomepageBanners({ isActive: activeFilter }))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [activeFilter])

  useEffect(() => {
    let active = true
    getHomepageBanners({ isActive: activeFilter }).then((items) => {
      if (active) setBanners(items)
    }).catch((loadError) => {
      if (active) setError(loadError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [activeFilter])

  function startCreate() {
    setEditing(null)
    setForm({ ...EMPTY_BANNER })
    setFormError('')
    setShowForm(true)
  }

  function startEdit(banner) {
    const asDateInput = (date) => date ? new Date(date).toISOString().slice(0, 16) : ''
    setEditing(banner)
    setForm({
      Title: value(banner, 'title', 'Title'),
      Subtitle: value(banner, 'subtitle', 'Subtitle'),
      Description: value(banner, 'description', 'Description'),
      ImageUrl: value(banner, 'imageUrl', 'ImageUrl'),
      MobileImageUrl: value(banner, 'mobileImageUrl', 'MobileImageUrl'),
      ButtonText: value(banner, 'buttonText', 'ButtonText'),
      ButtonUrl: value(banner, 'buttonUrl', 'ButtonUrl'),
      PromotionCode: value(banner, 'promotionCode', 'PromotionCode'),
      DisplayOrder: value(banner, 'displayOrder', 'DisplayOrder', 0),
      StartDate: asDateInput(value(banner, 'startDate', 'StartDate')),
      EndDate: asDateInput(value(banner, 'endDate', 'EndDate')),
      IsActive: value(banner, 'isActive', 'IsActive', true) === true || value(banner, 'isActive', 'IsActive') === 1,
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
      DisplayOrder: Number(form.DisplayOrder),
      StartDate: form.StartDate || null,
      EndDate: form.EndDate || null,
    }
    try {
      if (editing) await updateHomepageBanner(value(editing, 'bannerId', 'BannerId'), data)
      else await createHomepageBanner(data)
      setShowForm(false)
      await load()
    } catch (saveError) {
      setFormError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(banner) {
    try {
      const active = value(banner, 'isActive', 'IsActive', false) === true || value(banner, 'isActive', 'IsActive') === 1
      await setHomepageBannerActive(value(banner, 'bannerId', 'BannerId'), !active)
      await load()
    } catch (actionError) {
      setError(actionError.message)
    }
  }

  async function remove(banner) {
    if (!window.confirm(`Delete “${value(banner, 'title', 'Title')}” banner?`)) return
    try {
      await deleteHomepageBanner(value(banner, 'bannerId', 'BannerId'))
      await load()
    } catch (actionError) {
      setError(actionError.message)
    }
  }

  return (
    <AdminModuleLayout activeModule="banners" title="Homepage banners" user={user} onLogout={onLogout} onNavigate={onNavigate}>
      <section className="page-content module-page">
        <div className="module-heading"><div><p className="module-eyebrow">STOREFRONT CONTENT</p><h1>Homepage banners</h1><p>Schedule and publish the campaigns shown on your storefront.</p></div><button className="module-button primary" onClick={startCreate} type="button">Add banner</button></div>
        <div className="module-toolbar"><select aria-label="Filter banners by status" className="module-select module-filter" onChange={(event) => setActiveFilter(event.target.value)} value={activeFilter}><option value="">All banners</option><option value="true">Active</option><option value="false">Inactive</option></select><button className="module-button" onClick={load} type="button">Refresh</button></div>
        {showForm && <section className="module-form-panel"><h2>{editing ? 'Edit banner' : 'Create banner'}</h2>{formError && <p className="module-alert" role="alert">{formError}</p>}
          <form className="module-form" onSubmit={submit}>
            <label className="module-field">Title<input className="module-input" maxLength="150" onChange={(event) => setForm({ ...form, Title: event.target.value })} required value={form.Title} /></label>
            <label className="module-field">Subtitle<input className="module-input" maxLength="250" onChange={(event) => setForm({ ...form, Subtitle: event.target.value })} value={form.Subtitle} /></label>
            <label className="module-field wide">Description<textarea className="module-textarea" maxLength="1000" onChange={(event) => setForm({ ...form, Description: event.target.value })} value={form.Description} /></label>
            <label className="module-field">Desktop image URL<input className="module-input" maxLength="500" onChange={(event) => setForm({ ...form, ImageUrl: event.target.value })} required type="url" value={form.ImageUrl} /></label>
            <label className="module-field">Mobile image URL<input className="module-input" maxLength="500" onChange={(event) => setForm({ ...form, MobileImageUrl: event.target.value })} type="url" value={form.MobileImageUrl} /></label>
            <label className="module-field">Button text<input className="module-input" maxLength="50" onChange={(event) => setForm({ ...form, ButtonText: event.target.value })} value={form.ButtonText} /></label>
            <label className="module-field">Button URL<input className="module-input" maxLength="500" onChange={(event) => setForm({ ...form, ButtonUrl: event.target.value })} value={form.ButtonUrl} /></label>
            <label className="module-field">Promotion code<input className="module-input" maxLength="50" onChange={(event) => setForm({ ...form, PromotionCode: event.target.value })} value={form.PromotionCode} /></label>
            <label className="module-field">Display order<input className="module-input" min="0" onChange={(event) => setForm({ ...form, DisplayOrder: event.target.value })} type="number" value={form.DisplayOrder} /></label>
            <label className="module-field">Starts at<input className="module-input" onChange={(event) => setForm({ ...form, StartDate: event.target.value })} type="datetime-local" value={form.StartDate} /></label>
            <label className="module-field">Ends at<input className="module-input" onChange={(event) => setForm({ ...form, EndDate: event.target.value })} type="datetime-local" value={form.EndDate} /></label>
            <label className="module-checkbox"><input checked={form.IsActive} onChange={(event) => setForm({ ...form, IsActive: event.target.checked })} type="checkbox" />Active</label>
            <div className="module-form-actions"><button className="module-button" disabled={saving} onClick={() => setShowForm(false)} type="button">Cancel</button><button className="module-button primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save banner'}</button></div>
          </form>
        </section>}
        <section className="module-panel"><div className="module-panel-heading"><h2>Campaigns</h2><span>{banners.length} banners</span></div>
          {error && <div className="module-state error" role="alert">{error}</div>}
          {loading ? <div className="module-state">Loading banners…</div> : banners.length === 0 ? <div className="module-state">No banners found.</div> : <div className="module-table-wrap"><table className="module-table"><thead><tr><th>Campaign</th><th>Schedule</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {banners.map((banner) => {
              const id = value(banner, 'bannerId', 'BannerId')
              const active = value(banner, 'isActive', 'IsActive', false) === true || value(banner, 'isActive', 'IsActive') === 1
              return <tr key={id}><td><strong>{value(banner, 'title', 'Title')}</strong><span className="muted">{value(banner, 'subtitle', 'Subtitle') || value(banner, 'promotionCode', 'PromotionCode') || value(banner, 'imageUrl', 'ImageUrl')}</span></td><td>{dateTime(value(banner, 'startDate', 'StartDate'))}<span className="muted">to {dateTime(value(banner, 'endDate', 'EndDate')) || 'No end date'}</span></td><td>{value(banner, 'displayOrder', 'DisplayOrder', 0)}</td><td>{active ? 'Active' : 'Inactive'}</td><td><div className="module-row-actions"><button className="module-button" onClick={() => startEdit(banner)} type="button">Edit</button><button className="module-button" onClick={() => toggleActive(banner)} type="button">{active ? 'Deactivate' : 'Activate'}</button><button className="module-button danger" onClick={() => remove(banner)} type="button">Delete</button></div></td></tr>
            })}
          </tbody></table></div>}
        </section>
      </section>
    </AdminModuleLayout>
  )
}

export default HomepageBannersPage
