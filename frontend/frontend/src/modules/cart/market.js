export const MARKET_COUNTRIES = [
  { code: 'IN', name: 'India' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czechia' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MT', name: 'Malta' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'QA', name: 'Qatar' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'OM', name: 'Oman' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
]

export const MARKET_PREFERENCE_EVENT = 'jaysha-market-change'
const MARKET_PREFERENCE_KEY = 'jaysha-market-preference'

export function getCountry(code) {
  return MARKET_COUNTRIES.find((country) => country.code === code) || MARKET_COUNTRIES[0]
}

export function getCountryCode(countryName) {
  const normalized = String(countryName || '').trim().toLowerCase()
  const aliases = {
    india: 'IN',
    usa: 'US',
    'u.s.a.': 'US',
    'united states of america': 'US',
    uk: 'GB',
    'great britain': 'GB',
    uae: 'AE',
    'uae (united arab emirates)': 'AE',
  }
  const alias = aliases[normalized]
  if (alias) return alias

  return MARKET_COUNTRIES.find((country) =>
    country.code.toLowerCase() === normalized || country.name.toLowerCase() === normalized,
  )?.code || ''
}

export function defaultCurrencyForCountry(countryCode) {
  return countryCode && countryCode !== 'IN' ? 'USD' : 'INR'
}

export function readMarketPreference() {
  try {
    const saved = JSON.parse(localStorage.getItem(MARKET_PREFERENCE_KEY) || 'null')
    const countryCode = getCountry(saved?.countryCode).code
    const currencyCode = countryCode === 'IN'
      ? (['INR', 'USD'].includes(saved?.currencyCode) ? saved.currencyCode : 'INR')
      : 'USD'
    return { countryCode, currencyCode }
  } catch {
    localStorage.removeItem(MARKET_PREFERENCE_KEY)
    return { countryCode: 'IN', currencyCode: 'INR' }
  }
}

export function saveMarketPreference(preference) {
  const countryCode = getCountry(preference.countryCode).code
  const next = {
    countryCode,
    currencyCode: countryCode === 'IN'
      ? (['INR', 'USD'].includes(preference.currencyCode) ? preference.currencyCode : 'INR')
      : 'USD',
  }
  localStorage.setItem(MARKET_PREFERENCE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(MARKET_PREFERENCE_EVENT, { detail: next }))
  return next
}

export function formatMarketPrice(amountInr, currencyCode, inrPerUsd) {
  const amount = Number(amountInr)
  if (!Number.isFinite(amount)) return '—'
  if (currencyCode === 'USD') {
    const rate = Number(inrPerUsd)
    if (!Number.isFinite(rate) || rate <= 0) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(amount / rate)
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}
