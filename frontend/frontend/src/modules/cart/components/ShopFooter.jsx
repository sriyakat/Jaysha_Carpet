import { useEffect, useState } from 'react'
import { getPublicWebsiteSettings } from '../../websiteSettings/api/publicWebsiteSettingsApi.js'
import './ShopFooter.css'

const DEFAULT_SETTINGS = {
  ShopName: 'Jaysha Carpet',
  FooterDescription: 'Thoughtfully woven rugs and timeless textures, made to bring warmth and character to your home.',
  ContactEmail: '',
  ContactPhone: '',
  WhatsAppNumber: '',
  BusinessAddress: '',
  InstagramUrl: '',
  FacebookUrl: '',
  PinterestUrl: '',
  YouTubeUrl: '',
  CopyrightText: '',
}
const CURRENT_YEAR = new Date().getFullYear()

function setting(settings, pascal, camel) {
  return settings?.[pascal] ?? settings?.[camel] ?? ''
}

function phoneLink(number) {
  const digits = number.replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : ''
}

function ShopFooter({ customerSession, onShopClick, onCartClick }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [settingsError, setSettingsError] = useState('')

  useEffect(() => {
    let active = true
    getPublicWebsiteSettings()
      .then((data) => {
        if (active) {
          setSettings({ ...DEFAULT_SETTINGS, ...data })
          setSettingsError('')
        }
      })
      .catch((error) => {
        if (active) setSettingsError(error.message)
      })
    return () => { active = false }
  }, [])

  const shopName = setting(settings, 'ShopName', 'shopName') || DEFAULT_SETTINGS.ShopName
  const description = setting(settings, 'FooterDescription', 'footerDescription') || DEFAULT_SETTINGS.FooterDescription
  const email = setting(settings, 'ContactEmail', 'contactEmail')
  const phone = setting(settings, 'ContactPhone', 'contactPhone')
  const whatsapp = setting(settings, 'WhatsAppNumber', 'whatsAppNumber')
  const address = setting(settings, 'BusinessAddress', 'businessAddress')
  const copyright = setting(settings, 'CopyrightText', 'copyrightText') || `© ${CURRENT_YEAR} ${shopName}. All rights reserved.`
  const socialLinks = [
    ['Instagram', setting(settings, 'InstagramUrl', 'instagramUrl')],
    ['Facebook', setting(settings, 'FacebookUrl', 'facebookUrl')],
    ['Pinterest', setting(settings, 'PinterestUrl', 'pinterestUrl')],
    ['YouTube', setting(settings, 'YouTubeUrl', 'youTubeUrl')],
  ].filter(([, href]) => Boolean(href))

  return (
    <footer className="store-footer">
      <div className="store-footer-main">
        <section className="store-footer-brand">
          <a aria-label={`${shopName} home`} className="store-footer-logo" href="/shop" onClick={(event) => { event.preventDefault(); onShopClick() }}>
            <span className="store-footer-mark">J</span>
            <span><strong>{shopName}</strong><small>HANDWOVEN HOME</small></span>
          </a>
          <p>{description}</p>
          {socialLinks.length > 0 && <div aria-label="Social media" className="store-footer-socials">
            {socialLinks.map(([label, href]) => <a href={href} key={label} rel="noreferrer" target="_blank">{label}</a>)}
          </div>}
        </section>

        <nav aria-label="Footer shop links" className="store-footer-column">
          <h2>Explore</h2>
          <a href="/shop" onClick={(event) => { event.preventDefault(); onShopClick() }}>Shop all rugs</a>
          <button onClick={onCartClick} type="button">View your cart</button>
          <a href={customerSession ? '/account' : '/customer/login'}>{customerSession ? 'My account' : 'Customer sign in'}</a>
        </nav>

        <section className="store-footer-column">
          <h2>Get in touch</h2>
          {email && <a href={`mailto:${email}`}>{email}</a>}
          {phone && <a href={phoneLink(phone)}>{phone}</a>}
          {whatsapp && <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} rel="noreferrer" target="_blank">Chat on WhatsApp</a>}
          {address && <p className="store-footer-address">{address}</p>}
          {!email && !phone && !whatsapp && !address && <p>For product and order assistance, sign in to your customer account.</p>}
        </section>
      </div>
      <div className="store-footer-bottom">
        <span>{copyright}</span>
        <a href="/admin/login">Store admin</a>
      </div>
      {settingsError && <span className="store-footer-settings-note" role="status">Store contact details are temporarily unavailable.</span>}
    </footer>
  )
}

export default ShopFooter
