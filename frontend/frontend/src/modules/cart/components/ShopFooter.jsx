import { useEffect, useState } from 'react'
import { getPublicWebsiteSettings } from '../../websiteSettings/api/publicWebsiteSettingsApi.js'
import { getProductImageUrl } from '../../product/api/productApi.js'
import {
  defaultCurrencyForCountry,
  MARKET_COUNTRIES,
  readMarketPreference,
  saveMarketPreference,
} from '../market.js'
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
  InrPerUsd: null,
}
const CURRENT_YEAR = new Date().getFullYear()

function setting(settings, pascal, camel) {
  return settings?.[pascal] ?? settings?.[camel] ?? ''
}

function phoneLink(number) {
  const digits = number.replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : ''
}

function whatsappUrl(number) {
  let digits = String(number || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 10) digits = `91${digits}`
  return `https://wa.me/${digits}`
}

function WhatsAppFloatingButton({ number }) {
  const href = whatsappUrl(number)
  if (!href) return null

  return (
    <a
      aria-label="Chat with Jaysha Carpet on WhatsApp"
      className="whatsapp-floating-button"
      href={href}
      rel="noreferrer"
      target="_blank"
      title="Chat on WhatsApp"
    >
      <span className="whatsapp-floating-label">Chat on WhatsApp</span>
      <svg aria-hidden="true" viewBox="0 0 32 32">
        <path className="whatsapp-phone-bg" d="M16 2.8A13.2 13.2 0 0 0 4.7 22.3L3 29l7-2.2A13.2 13.2 0 1 0 16 2.8Z" />
        <path className="whatsapp-phone-icon" d="M11.3 9.1c-.3-.7-.6-.7-.9-.7h-.8c-.3 0-.7.1-1.1.5-.4.4-1.5 1.5-1.5 3.6s1.5 4.2 1.7 4.5c.2.3 3 4.6 7.3 6.3 3.6 1.4 4.3 1.1 5.1 1 .8-.1 2.6-1 3-2 .4-1 .4-1.8.3-2-.1-.2-.4-.3-.8-.5l-3-1.4c-.4-.2-.7-.3-1 .3-.3.4-1 1.4-1.3 1.7-.3.3-.5.4-1 .1-.4-.2-1.9-.7-3.6-2.2-1.3-1.2-2.2-2.7-2.5-3.2-.3-.4 0-.7.2-.9l.7-.8c.2-.2.3-.4.4-.7.1-.2 0-.5-.1-.7l-1.1-2.9Z" />
      </svg>
    </a>
  )
}

function ShopFooter({ customerSession, onShopClick, onCartClick }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [settingsError, setSettingsError] = useState('')
  const [market, setMarket] = useState(readMarketPreference)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterMessage, setNewsletterMessage] = useState('')

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
  const inrPerUsd = Number(setting(settings, 'InrPerUsd', 'inrPerUsd')) || 0
  const description = setting(settings, 'FooterDescription', 'footerDescription') || DEFAULT_SETTINGS.FooterDescription
  const email = setting(settings, 'ContactEmail', 'contactEmail')
  const phone = setting(settings, 'ContactPhone', 'contactPhone')
  const whatsapp = setting(settings, 'WhatsAppNumber', 'whatsAppNumber')
  const address = setting(settings, 'BusinessAddress', 'businessAddress')
  const sampleHref = email
    ? `mailto:${email}?subject=${encodeURIComponent('Wool sample box request')}&body=${encodeURIComponent('Please let me know whether a wool sample box is available and how to request one.')}`
    : '#shop-footer-contact'
  const copyright = setting(settings, 'CopyrightText', 'copyrightText') || `© ${CURRENT_YEAR} ${shopName}. All rights reserved.`
  const socialLinks = [
    ['Instagram', setting(settings, 'InstagramUrl', 'instagramUrl')],
    ['Facebook', setting(settings, 'FacebookUrl', 'facebookUrl')],
    ['Pinterest', setting(settings, 'PinterestUrl', 'pinterestUrl')],
    ['YouTube', setting(settings, 'YouTubeUrl', 'youTubeUrl')],
  ].filter(([, href]) => Boolean(href))

  return (
    <footer className="store-footer" id="shop-footer">
      <div className="store-footer-main">
        <section className="store-footer-brand">
          <a aria-label={`${shopName} home`} className="store-footer-logo" href="/shop" onClick={(event) => { event.preventDefault(); onShopClick() }}>
            {setting(settings, 'LogoStorageKey', 'logoStorageKey')
              ? <img alt="" className="store-footer-image-mark" src={getProductImageUrl(setting(settings, 'LogoStorageKey', 'logoStorageKey'))} />
              : <span className="store-footer-mark">J</span>}
            <span><strong>{shopName}</strong><small>HANDWOVEN HOME</small></span>
          </a>
          <p>{description}</p>
          {socialLinks.length > 0 && <div aria-label="Social media" className="store-footer-socials">
            {socialLinks.map(([label, href]) => <a href={href} key={label} rel="noreferrer" target="_blank">{label}</a>)}
          </div>}
        </section>

        <nav aria-label="Explore rugs and collections" className="store-footer-column">
          <h2>Explore</h2>
          <a href="/shop" onClick={(event) => { event.preventDefault(); onShopClick() }}>Shop all rugs</a>
          <a href="#shop-categories-title">Collections</a>
          <a href="#shop-bespoke-title">Bespoke studio</a>
          <a href="#shop-new-arrivals">New Arrivals</a>
          <button onClick={onCartClick} type="button">View your cart</button>
          <a href={customerSession ? '/account' : '/customer/login'}>{customerSession ? 'My account' : 'Customer sign in'}</a>
        </nav>
        <nav aria-label="Customer support" className="store-footer-column" id="shop-footer-contact">
          <h2>Customer support</h2>
          {email && <a href={`mailto:${email}`}>{email}</a>}
          {phone && <a href={phoneLink(phone)}>{phone}</a>}
          {whatsapp && <a href={whatsappUrl(whatsapp)} rel="noreferrer" target="_blank">Chat on WhatsApp</a>}
          {address && <p className="store-footer-address">{address}</p>}
          {!email && !phone && !whatsapp && !address && <p>For product and order assistance, sign in to your customer account.</p>}
          <a href="#shop-journal-title">Rug sizing journal</a>
          <a href="#shop-journal-title">Rug care journal</a>
          <a href="#shop-journal-title">The Jaysha journal</a>
          <a href="#shop-bespoke-title">Request a custom carpet quote</a>
          <a href={sampleHref}>Request a wool sample box</a>
        </nav>
        <section className="store-footer-column store-footer-region">
          <h2>Stay in the know</h2>
          <form
            className="store-footer-newsletter"
            onSubmit={(event) => {
              event.preventDefault()
              if (!email) {
                setNewsletterMessage('Newsletter contact is not configured yet. Please use customer support.')
                return
              }
              const subject = encodeURIComponent('Jaysha Carpet newsletter subscription')
              const body = encodeURIComponent(`Please add ${newsletterEmail.trim()} to the Jaysha Carpet newsletter.`)
              window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
              setNewsletterMessage('Your email app will open with a subscription request. Send the draft to complete it.')
            }}
          >
            <label htmlFor="shop-newsletter-email">Occasional notes on rugs, craft and new collections.</label>
            <div className="store-footer-newsletter-entry">
              <input autoComplete="email" id="shop-newsletter-email" onChange={(event) => setNewsletterEmail(event.target.value)} placeholder="Email address" required type="email" value={newsletterEmail} />
              <button aria-label="Prepare newsletter subscription request" type="submit">→</button>
            </div>
            {newsletterMessage && <small aria-live="polite" role="status">{newsletterMessage}</small>}
          </form>
          <h2 className="store-footer-region-heading">Your region</h2>
          <label htmlFor="shop-shipping-region">Country or delivery region</label>
          <select id="shop-shipping-region" onChange={(event) => {
            const countryCode = event.target.value
            const currencyCode = defaultCurrencyForCountry(countryCode)
            const next = saveMarketPreference({
              countryCode,
              currencyCode,
            })
            setMarket(next)
          }} value={market.countryCode}>
            {MARKET_COUNTRIES.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
          </select>
          <label htmlFor="shop-currency">Display currency</label>
          <select id="shop-currency" onChange={(event) => {
            const next = saveMarketPreference({ ...market, currencyCode: event.target.value })
            setMarket(next)
          }} value={market.currencyCode}>
            {market.countryCode === 'IN' && <option value="INR">INR · Indian Rupee</option>}
            <option value="USD">USD · US Dollar</option>
          </select>
          <small>
            {market.countryCode === 'IN'
              ? 'India checkout is charged in INR.'
              : inrPerUsd
                ? 'International prices are the USD amounts set by the store; import charges may be payable on delivery.'
                : 'International product prices use the store-set USD amounts; checkout setup is still required.'}
          </small>
        </section>
      </div>
      <div className="store-footer-bottom">
        <span>{copyright}</span>
        <div className="store-footer-legal">
          <a href="/policies/shipping">Shipping & customs</a>
          <a href="/policies/returns">Returns</a>
          <a href="/policies/privacy">Privacy</a>
          <a href="/policies/terms">Terms</a>
          <a href="/admin/login">Store admin</a>
        </div>
      </div>
      {settingsError && <span className="store-footer-settings-note" role="status">Store contact details are temporarily unavailable.</span>}
      <WhatsAppFloatingButton number={whatsapp} />
    </footer>
  )
}

export default ShopFooter
