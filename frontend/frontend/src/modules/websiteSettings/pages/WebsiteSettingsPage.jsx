import { useEffect, useState } from 'react'
import AdminModuleLayout from '../../shared/components/AdminModuleLayout.jsx'
import ImageUploadField from '../../shared/components/ImageUploadField.jsx'
import { deleteContentImage, getContentImageMap, uploadContentImage } from '../../shared/api/contentImageApi.js'
import { MARKET_COUNTRIES } from '../../cart/market.js'
import '../shared/AdminModulePage.css'
import { getWebsiteSettings, updateWebsiteSettings } from '../api/websiteSettingsApi.js'

const DEFAULT_SHIPPING_POLICY = 'Shipping costs and estimated delivery times are shown before checkout. International import VAT, customs duties and local charges are not included in the order total. If local authorities charge them, they are payable by the customer on delivery.'

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
  ['MetaTitle', 'SEO title', 'text'],
  ['MetaDescription', 'SEO description', 'textarea'],
  ['CanonicalBaseUrl', 'Canonical website URL', 'url'],
  ['ShippingPolicy', 'Shipping, delivery & customs policy', 'textarea'],
  ['ReturnPolicy', 'Returns & refunds policy', 'textarea'],
  ['PrivacyPolicy', 'Privacy policy', 'textarea'],
  ['TermsAndConditions', 'Terms & conditions', 'textarea'],
]

function WebsiteSettingsPage({ user, onLogout, onNavigate }) {
  const [settings, setSettings] = useState({})
  const [logoKey, setLogoKey] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [logoRemoved, setLogoRemoved] = useState(false)
  const [robotsIndex, setRobotsIndex] = useState(true)
  const [inrPerUsd, setInrPerUsd] = useState('')
  const [shippingRates, setShippingRates] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getWebsiteSettings(), getContentImageMap('website-settings')]).then(([data, images]) => {
      if (active) {
        setSettings(Object.fromEntries(fields.map(([key]) => [
          key,
          data[key] ?? (key === 'ShippingPolicy' ? DEFAULT_SHIPPING_POLICY : ''),
        ])))
        setRobotsIndex(data.RobotsIndex !== false)
        setLogoKey(images.store || '')
        setInrPerUsd(data.InrPerUsd ?? '')
        setShippingRates(data.InternationalShippingRates || {})
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
      const payload = await updateWebsiteSettings({
        ...settings,
        RobotsIndex: robotsIndex,
        InrPerUsd: inrPerUsd === '' ? null : Number(inrPerUsd),
        InternationalShippingRates: shippingRates,
      })
      if (payload?.data) {
        setSettings(Object.fromEntries(fields.map(([key]) => [
          key,
          payload.data[key] ?? (key === 'ShippingPolicy' ? DEFAULT_SHIPPING_POLICY : ''),
        ])))
        setInrPerUsd(payload.data.InrPerUsd ?? '')
        setShippingRates(payload.data.InternationalShippingRates || {})
      }
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
          <p className="module-state">International checkout stays unavailable until an exchange rate, shipping rates, delivery estimates and all policy text are configured.</p>
          {loading ? <div className="module-state">Loading website settings…</div> : <form className="module-form settings-form" onSubmit={submit}>
            <div className="module-field wide"><span>Store logo (optional)</span><ImageUploadField file={logoFile} hint="JPEG, PNG, WebP ya GIF · Maximum 15 MB" id="storeLogo" label="Store logo" onClear={() => { setLogoFile(null); setLogoKey(''); setLogoRemoved(true) }} onFileChange={(file) => { setLogoFile(file); setLogoRemoved(false) }} value={logoKey} /></div>
            {fields.map(([key, label, type]) => <label className={`module-field${type === 'textarea' ? ' wide' : ''}`} key={key}>{label}{type === 'textarea'
              ? <textarea className="module-textarea" onChange={(event) => setSettings({ ...settings, [key]: event.target.value })} value={settings[key] ?? ''} />
              : <input className="module-input" onChange={(event) => setSettings({ ...settings, [key]: event.target.value })} type={type === 'email' || type === 'url' ? 'text' : type} value={settings[key] ?? ''} />}</label>)}
            <label className="module-field wide">INR per 1 USD
              <input className="module-input" onChange={(event) => setInrPerUsd(event.target.value)} step="any" type="number" value={inrPerUsd} />
              <small>Set and update this rate yourself. International prices and card charges stay disabled until it is configured.</small>
            </label>
            <div className="module-field wide">
              <strong>International shipping rates (USD)</strong>
              <small>Enter a rate and delivery estimate for each country you serve. Unconfigured countries cannot check out.</small>
              <div className="market-shipping-rate-list">
                {MARKET_COUNTRIES.filter((country) => country.code !== 'IN').map((country) => {
                  const rate = shippingRates[country.code] || {}
                  return (
                    <div className="market-shipping-rate-row" key={country.code}>
                      <strong>{country.name}</strong>
                      <label>{country.code} shipping (USD)
                        <input className="module-input" onChange={(event) => setShippingRates((current) => ({
                          ...current,
                          [country.code]: { ...current[country.code], shippingUsd: event.target.value === '' ? '' : Number(event.target.value) },
                        }))} step="any" type="number" value={rate.shippingUsd ?? ''} />
                      </label>
                      <label>Delivery estimate
                        <input className="module-input" onChange={(event) => setShippingRates((current) => ({
                          ...current,
                          [country.code]: { ...current[country.code], deliveryEstimate: event.target.value },
                        }))} placeholder="e.g. 7–14 business days" value={rate.deliveryEstimate ?? ''} />
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
            <label className="module-field wide"><span>Search engine indexing</span><input checked={robotsIndex} onChange={(event) => setRobotsIndex(event.target.checked)} type="checkbox" /> <span>{robotsIndex ? 'Allow search engines to index this store' : 'Block search engine indexing'}</span></label>
            <div className="module-form-actions"><button className="module-button primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save settings'}</button></div>
          </form>}
        </section>
      </section>
    </AdminModuleLayout>
  )
}

export default WebsiteSettingsPage
