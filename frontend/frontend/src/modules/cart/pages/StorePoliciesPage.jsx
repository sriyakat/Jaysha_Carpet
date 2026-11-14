import { useEffect, useState } from 'react'
import { getPublicWebsiteSettings } from '../../websiteSettings/api/publicWebsiteSettingsApi.js'
import './InternationalStorefront.css'

const policies = {
  '/policies/shipping': {
    title: 'Shipping & customs',
    key: 'ShippingPolicy',
    fallback: 'Shipping costs and estimated delivery times are shown before checkout. International import VAT, customs duties and local charges are not included in the order total. If local authorities charge them, they are payable by the customer on delivery.',
  },
  '/policies/returns': { title: 'Returns & refunds', key: 'ReturnPolicy' },
  '/policies/privacy': { title: 'Privacy policy', key: 'PrivacyPolicy' },
  '/policies/terms': { title: 'Terms & conditions', key: 'TermsAndConditions' },
}

function StorePoliciesPage() {
  const [settings, setSettings] = useState(null)
  const [error, setError] = useState('')
  const policy = policies[window.location.pathname] || policies['/policies/shipping']

  useEffect(() => {
    let active = true
    getPublicWebsiteSettings()
      .then((data) => {
        if (active) setSettings(data)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
    return () => { active = false }
  }, [])

  const content = settings?.[policy.key] || policy.fallback || ''

  return (
    <main className="store-policy-page">
      <a href="/shop">← Back to shop</a>
      <p className="shop-eyebrow">JAYSHA CARPET</p>
      <h1>{policy.title}</h1>
      {error && <p role="alert">{error}</p>}
      {content
        ? <p className="store-policy-copy">{content}</p>
        : <p>This policy is not published yet. Please contact customer support before placing an order.</p>}
    </main>
  )
}

export default StorePoliciesPage
