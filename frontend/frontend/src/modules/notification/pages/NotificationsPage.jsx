import { useCallback, useEffect, useState } from 'react'
import AdminModuleLayout from '../../shared/components/AdminModuleLayout.jsx'
import '../shared/AdminModulePage.css'
import { createNotification, deleteNotification, getAdminNotifications, markNotificationSent } from '../api/adminNotificationApi.js'

function value(item, camel, pascal, fallback = '') {
  return item?.[camel] ?? item?.[pascal] ?? fallback
}

function isEnabled(valueToCheck) {
  return valueToCheck === true || valueToCheck === 1 || valueToCheck === '1' || valueToCheck === 'true'
}

const emptyForm = { NotificationType: 'ORDER_UPDATE', Title: '', Message: '', CustomerId: '', OrderId: '', RecipientEmail: '' }

function NotificationsPage({ user, onLogout, onNavigate }) {
  const [notifications, setNotifications] = useState([])
  const [sentFilter, setSentFilter] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const items = await getAdminNotifications({ isSent: sentFilter })
      setNotifications(items)
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [sentFilter])

  useEffect(() => {
    let active = true
    getAdminNotifications({ isSent: sentFilter })
      .then((items) => {
        if (active) {
          setNotifications(items)
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
  }, [sentFilter])

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    const data = {
      ...form,
      CustomerId: form.CustomerId ? Number(form.CustomerId) : null,
      OrderId: form.OrderId ? Number(form.OrderId) : null,
      RecipientEmail: form.RecipientEmail.trim() || null,
    }
    try {
      await createNotification(data)
      setShowForm(false)
      setForm(emptyForm)
      await load()
    } catch (saveError) {
      setFormError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function updateSent(item) {
    try {
      await markNotificationSent(value(item, 'notificationId', 'NotificationId'))
      await load()
    } catch (actionError) {
      setError(actionError.message)
    }
  }

  async function remove(item) {
    const id = value(item, 'notificationId', 'NotificationId')
    if (!window.confirm('Delete this notification?')) return
    try {
      await deleteNotification(id)
      await load()
    } catch (actionError) {
      setError(actionError.message)
    }
  }

  return (
    <AdminModuleLayout activeModule="notifications" title="Notifications" user={user} onLogout={onLogout} onNavigate={onNavigate}>
      <section className="page-content module-page">
        <div className="module-heading"><div><p className="module-eyebrow">CUSTOMER COMMUNICATION</p><h1>Notifications</h1><p>Create and track customer notification records.</p></div><button className="module-button primary" onClick={() => { setShowForm(true); setFormError('') }} type="button">Create notification</button></div>
        {showForm && <section className="module-form-panel">
          <h2>New notification</h2>{formError && <p className="module-alert" role="alert">{formError}</p>}
          <form className="module-form" onSubmit={submit}>
            <label className="module-field">Type<input className="module-input" maxLength="50" onChange={(event) => setForm({ ...form, NotificationType: event.target.value })} required value={form.NotificationType} /></label>
            <label className="module-field">Title<input className="module-input" maxLength="150" onChange={(event) => setForm({ ...form, Title: event.target.value })} required value={form.Title} /></label>
            <label className="module-field">Customer ID (optional)<input className="module-input" min="1" onChange={(event) => setForm({ ...form, CustomerId: event.target.value })} type="number" value={form.CustomerId} /></label>
            <label className="module-field">Order ID (optional)<input className="module-input" min="1" onChange={(event) => setForm({ ...form, OrderId: event.target.value })} type="number" value={form.OrderId} /></label>
            <label className="module-field wide">Recipient email (optional)<input className="module-input" maxLength="150" onChange={(event) => setForm({ ...form, RecipientEmail: event.target.value })} type="email" value={form.RecipientEmail} /></label>
            <label className="module-field wide">Message<textarea className="module-textarea" maxLength="1000" onChange={(event) => setForm({ ...form, Message: event.target.value })} required value={form.Message} /></label>
            <div className="module-form-actions"><button className="module-button" disabled={saving} onClick={() => setShowForm(false)} type="button">Cancel</button><button className="module-button primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Create notification'}</button></div>
          </form>
        </section>}
        <div className="module-toolbar"><div className="module-toolbar-group"><select aria-label="Filter notifications by email status" className="module-select module-filter" onChange={(event) => setSentFilter(event.target.value)} value={sentFilter}><option value="">All email statuses</option><option value="0">Not sent</option><option value="1">Sent</option></select></div><button className="module-button" onClick={load} type="button">Refresh</button></div>
        <section className="module-panel">
          <div className="module-panel-heading"><h2>Notification records</h2><span>{notifications.length} records</span></div>
          {error && <div className="module-state error" role="alert">{error}</div>}
          {loading ? <div className="module-state">Loading notifications…</div> : notifications.length === 0 ? <div className="module-state">No notifications match this filter.</div> : (
            <div className="module-table-wrap"><table className="module-table"><thead><tr><th>Notification</th><th>Customer / order</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead><tbody>
              {notifications.map((item) => {
                const id = value(item, 'notificationId', 'NotificationId')
                const sent = isEnabled(value(item, 'isSent', 'IsSent', false))
                return <tr key={id}><td><strong>{value(item, 'title', 'Title')}</strong><span className="muted">{value(item, 'message', 'Message')}</span></td><td><strong>{value(item, 'customerName', 'CustomerName', value(item, 'customerId', 'CustomerId', '—'))}</strong><span className="muted">Order {value(item, 'orderId', 'OrderId', '—')}</span></td><td>{value(item, 'recipientEmail', 'RecipientEmail', '—')}</td><td>{sent ? 'Sent' : 'Not sent'}</td><td><div className="module-row-actions">{!sent && <button className="module-button" onClick={() => updateSent(item)} type="button">Mark sent</button>}<button className="module-button danger" onClick={() => remove(item)} type="button">Delete</button></div></td></tr>
              })}
            </tbody></table></div>
          )}
        </section>
      </section>
    </AdminModuleLayout>
  )
}

export default NotificationsPage
