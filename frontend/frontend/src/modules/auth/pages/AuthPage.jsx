import { useState } from 'react'
import { createAdmin, loginAdmin } from '../api/authApi.js'

function AuthPage({ mode, onLogin, onAdminCreated }) {
  const isSetup = mode === 'setup'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (isSetup) {
        await createAdmin({ fullName, email, password })
        onAdminCreated()
      } else {
        const response = await loginAdmin({ email, password })
        onLogin(response.data)
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section aria-label="Jaysha Carpet admin access" className="auth-showcase">
        <a className="auth-brand" href="/shop">
          <span aria-hidden="true" className="auth-brand-mark">J</span>
          <span>
            <strong>Jaysha Carpet</strong>
            <small>STORE ADMIN</small>
          </span>
        </a>

        <div className="auth-showcase-copy">
          <span className="auth-kicker">A MORE THOUGHTFUL WORKSPACE</span>
          <h1>Your store,<br />beautifully in order.</h1>
          <p>Apne carpet collections ko ek hi jagah se manage karein.</p>
        </div>

        <div aria-hidden="true" className="auth-woven-art">
          <svg className="woven-rug" fill="none" viewBox="0 0 420 450">
            <defs>
              <linearGradient id="rug-ground" x1="105" x2="330" y1="30" y2="400" gradientUnits="userSpaceOnUse">
                <stop stopColor="#829276" />
                <stop offset=".52" stopColor="#59694F" />
                <stop offset="1" stopColor="#344A3B" />
              </linearGradient>
              <pattern id="rug-weave" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M0 1.5h8M0 5.5h8" stroke="#E4D9B6" strokeOpacity=".15" strokeWidth="1" />
                <path d="M1.5 0v8M5.5 0v8" stroke="#17281F" strokeOpacity=".18" strokeWidth="1" />
              </pattern>
              <pattern id="rug-border" width="34" height="34" patternUnits="userSpaceOnUse">
                <path d="m17 3 14 14-14 14L3 17 17 3Z" stroke="#E6D29A" strokeOpacity=".72" strokeWidth="1.2" />
                <circle cx="17" cy="17" r="3" fill="#D9C38B" fillOpacity=".75" />
                <path d="M17 8v18M8 17h18" stroke="#E6D29A" strokeOpacity=".4" />
              </pattern>
              <filter id="rug-shadow" x="30" y="0" width="390" height="450" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
                <feGaussianBlur in="SourceAlpha" stdDeviation="13" />
                <feOffset dx="2" dy="14" />
                <feComponentTransfer>
                  <feFuncA slope=".38" type="linear" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g filter="url(#rug-shadow)" transform="rotate(8 215 220)">
              <rect x="102" y="30" width="218" height="370" rx="5" fill="url(#rug-ground)" stroke="#E8D7AA" strokeWidth="2" />
              <rect x="109" y="37" width="204" height="356" rx="2" stroke="#D8C18A" strokeOpacity=".8" strokeWidth="1.5" />
              <rect x="116" y="44" width="190" height="342" fill="url(#rug-weave)" />
              <rect x="123" y="51" width="176" height="328" stroke="#E5D29E" strokeOpacity=".76" strokeWidth="2" />
              <rect x="130" y="58" width="162" height="314" fill="url(#rug-border)" stroke="#C9B37E" strokeWidth="1.2" />
              <rect x="145" y="73" width="132" height="284" fill="url(#rug-weave)" stroke="#E7D8B1" strokeOpacity=".82" strokeWidth="2" />
              <rect x="153" y="81" width="116" height="268" stroke="#CFB982" strokeOpacity=".85" strokeWidth="1.2" />

              <g fill="#D8C38E" fillOpacity=".8" stroke="#F0E2BD" strokeOpacity=".76" strokeWidth="1.2">
                <path d="M211 125c-14-18-32 1-13 13-19 12-1 31 13 13 14 18 32-1 13-13 19-12 1-31-13-13Z" />
                <path d="M211 178c-19-24-43 1-17 17-26 16-2 41 17 17 19 24 43-1 17-17 26-16 2-41-17-17Z" fillOpacity=".72" />
                <path d="M211 231c-14-18-32 1-13 13-19 12-1 31 13 13 14 18 32-1 13-13 19-12 1-31-13-13Z" />
              </g>
              <path d="M211 150v12m0 53v12m-27-27h-12m78 0h-12" stroke="#F4E7C5" strokeWidth="2" strokeLinecap="round" />
              <circle cx="211" cy="207" r="24" stroke="#F0E2BD" strokeOpacity=".86" strokeWidth="2" />
              <circle cx="211" cy="207" r="8" fill="#E4D19C" />

              <path d="M103 39h-11m228 0h11M103 390h-11m228 0h11" stroke="#E5D3A5" strokeWidth="2" strokeLinecap="round" />
              <path d="M96 48v330m238-330v330" stroke="#D5BF8D" strokeOpacity=".56" strokeDasharray="2 5" />
              <path d="M126 30v-10m17 10V16m17 14V20m17 10V16m17 14V20m17 10V16m17 14V20m17 10V16m17 14V20m17 10V16m17 14V20m17 10V16" stroke="#E7D8B3" strokeOpacity=".76" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M126 400v10m17-10v14m17-14v10m17-10v14m17-14v10m17-10v14m17-14v10m17-10v14m17-14v10m17-10v14m17-14v10m17-10v14" stroke="#E7D8B3" strokeOpacity=".76" strokeWidth="1.4" strokeLinecap="round" />
            </g>
          </svg>
          <div className="woven-art-caption">
            <span aria-hidden="true" className="woven-caption-mark" />
            <span><strong>WOVEN WITH CARE</strong><small>MADE TO FEEL LIKE HOME</small></span>
          </div>
        </div>

        <p className="auth-showcase-footer">Thoughtfully woven. Carefully managed.</p>
      </section>

      <section className="auth-panel">
        <div className="auth-mobile-brand">
          <span aria-hidden="true" className="auth-brand-mark">J</span>
          <strong>Jaysha Carpet</strong>
        </div>

        <div className="auth-card">
          <div className="auth-security-badge">
            <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
              <path d="M8 1.7 13 3.6v3.8c0 3.2-2.1 5.7-5 6.9-2.9-1.2-5-3.7-5-6.9V3.6L8 1.7Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.4" />
              <path d="m5.8 7.8 1.5 1.5 3-3.1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
            </svg>
            SECURE ADMIN PORTAL
          </div>
          <span className="auth-card-kicker">{isSetup ? 'GET STARTED' : 'WELCOME BACK'}</span>
          <h2>{isSetup ? 'Create your admin' : 'Sign in to your store'}</h2>
          <p className="auth-card-description">
            {isSetup
              ? 'Apne store ka admin account banayein.'
              : 'Apne catalog ko manage karne ke liye sign in karein.'}
          </p>

          <form className="auth-form" onSubmit={submit}>
            {isSetup && (
              <div className="auth-field">
                <label htmlFor="fullName">Full name</label>
                <input
                  autoComplete="name"
                  autoFocus
                  id="fullName"
                  maxLength={150}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Aapka naam"
                  required
                  value={fullName}
                />
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <input
                autoComplete="email"
                autoFocus={!isSetup}
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                required
                type="email"
                value={email}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="auth-password-wrap">
                <input
                  autoComplete={isSetup ? 'new-password' : 'current-password'}
                  id="password"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isSetup ? 'Kam se kam 8 characters' : 'Apna password enter karein'}
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <button
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="password-visibility"
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {isSetup && <span className="auth-field-hint">Password kam se kam 8 characters ka hona chahiye.</span>}
            </div>

            {error && <p className="auth-error" role="alert">{error}</p>}

            <button className="auth-submit" disabled={submitting} type="submit">
              {submitting
                ? (isSetup ? 'Account ban raha hai...' : 'Signing in...')
                : (isSetup ? 'Create admin account' : 'Sign in')}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="auth-switch">
            {isSetup ? (
              <>
                <span>Admin account pehle se hai?</span>
                <a href="/admin/login">Sign in</a>
              </>
            ) : (
              <>
                <span>First time setup?</span>
                <a href="/setup-admin">Create admin</a>
              </>
            )}
          </div>
        </div>

        <p className="auth-legal">
          Secure access to your Jaysha Carpet workspace
          <a href="/shop">Browse rugs</a>
        </p>
      </section>
    </main>
  )
}

export default AuthPage
