import { useEffect, useState } from 'react'
import AdminModuleLayout from '../../shared/components/AdminModuleLayout.jsx'
import '../shared/AdminModulePage.css'
import { getWebsiteSettings, updateWebsiteSettings } from '../api/websiteSettingsApi.js'

const fields = [
  ['ShopName', 'Shop name', 'text'],
  ['ContactEmail', 'Contact email', 'email'],
  ['ContactPhone', 'Contact phone', 'tel'],
  ['WhatsAppNumber', 'WhatsApp number', 'tel'],
  ['BusinessAddress', 'Business address', 'textarea'],
  ['FooterDescription', 'Footer description', 'textarea'],
  ['InstagramUrl', 'Instagram URL', 'url'],
  ['FacebookUrl', 'Facebook URL', 'url'],
  ['PinterestUrl', 'Pinterest URL', 'url'],
  ['YouTubeUrl', 'YouTube URL', 'url'],
  ['CopyrightText', 'Copyright text', 'text'],
]

function WebsiteSettingsPage({ user, onLogout, onNavigate }) {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    getWebsiteSettings().then((data) => {
      if (active) setSettings(Object.fromEntries(fields.map(([key]) => [key, data[key] ?? ''])))
    }).catch((loadError) => {
      if (active) setError(loadError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = await updateWebsiteSettings(settings)
      if (payload?.data) setSettings(Object.fromEntries(fields.map(([key]) => [key, payload.data[key] ?? ''])))
      setSuccess(payload?.message || 'Website settings saved.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminModuleLayout activeModule="settings" title="Website settings" user={user} onLogout={onLogout} onNavigate={onNavigate}>
      <section className="page-content module-page">
        <div className="module-heading"><div><p className="module-eyebrow">STOREFRONT</p><h1>Website settings</h1><p>Control the public store identity, contact details, and social links.</p></div></div>
        {error && <p className="module-alert" role="alert">{error}</p>}
        {success && <p className="module-alert module-success" role="status">{success}</p>}
        <section className="module-form-panel">
          <div className="module-panel-heading"><h2>Storefront details</h2><span>Changes are visible to customers.</span></div>
          {loading ? <div className="module-state">Loading website settings…</div> : <form className="module-form settings-form" onSubmit={submit}>
            {fields.map(([key, label, type]) => <label className={`module-field${type === 'textarea' ? ' wide' : ''}`} key={key}>{label}{type === 'textarea'
              ? <textarea className="module-textarea" onChange={(event) => setSettings({ ...settings, [key]: event.target.value })} value={settings[key] ?? ''} />
              : <input className="module-input" onChange={(event) => setSettings({ ...settings, [key]: event.target.value })} type={type} value={settings[key] ?? ''} />}</label>)}
            <div className="module-form-actions"><button className="module-button primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save settings'}</button></div>
          </form>}
        </section>
      </section>
    </AdminModuleLayout>
  )
}

export default WebsiteSettingsPage
