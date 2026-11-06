import { useEffect, useState } from 'react'
import AdminModuleLayout from '../../shared/components/AdminModuleLayout.jsx'
import ImageUploadField from '../../shared/components/ImageUploadField.jsx'
import { deleteContentImage, getContentImageMap, uploadContentImage } from '../../shared/api/contentImageApi.js'
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
  const [logoKey, setLogoKey] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [logoRemoved, setLogoRemoved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getWebsiteSettings(), getContentImageMap('website-settings')]).then(([data, images]) => {
      if (active) {
        setSettings(Object.fromEntries(fields.map(([key]) => [key, data[key] ?? ''])))
        setLogoKey(images.store || '')
      }
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
      try {
        if (logoFile) {
          const result = await uploadContentImage('website-settings', 'store', logoFile)
          setLogoKey(result?.data?.storageKey || '')
          setLogoFile(null)
        } else if (logoRemoved) {
          await deleteContentImage('website-settings', 'store')
          setLogoKey('')
        }
        setLogoRemoved(false)
      } catch (imageError) {
        setError(`Website settings save ho gaye, lekin logo image save nahi hui: ${imageError.message}`)
        return
      }
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
            <div className="module-field wide"><span>Store logo (optional)</span><ImageUploadField file={logoFile} hint="JPEG, PNG, WebP ya GIF · Maximum 15 MB" id="storeLogo" label="Store logo" onClear={() => { setLogoFile(null); setLogoKey(''); setLogoRemoved(true) }} onFileChange={(file) => { setLogoFile(file); setLogoRemoved(false) }} value={logoKey} /></div>
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
