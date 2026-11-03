import { useCallback, useEffect, useState } from 'react'
import {
  changeCustomerPassword,
  getCustomerProfile,
  loginCustomer,
  resetPasswordWithOtp,
  sendPasswordResetOtp,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  updateCustomerProfile,
} from '../api/customerApi.js'
import CustomerCommercePanel from '../components/CustomerCommercePanel.jsx'
import './CustomerPage.css'

const CUSTOMER_SESSION_KEY = 'jaysha-customer-session'
const CUSTOMER_RETURN_TO_KEY = 'jaysha-customer-return-to'

function consumeCustomerReturnPath() {
  const returnTo = sessionStorage.getItem(CUSTOMER_RETURN_TO_KEY)
  sessionStorage.removeItem(CUSTOMER_RETURN_TO_KEY)
  return ['/shop', '/checkout', '/account', '/account/addresses', '/account/orders', '/account/returns', '/account/notifications', '/account/reviews'].includes(returnTo)
    ? returnTo
    : '/'
}

function readSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(CUSTOMER_SESSION_KEY) || 'null')
    return typeof session?.token === 'string' && session.token ? session : null
  } catch {
    sessionStorage.removeItem(CUSTOMER_SESSION_KEY)
    return null
  }
}

function CustomerPage() {
  const [path, setPath] = useState(window.location.pathname)
  const [session, setSession] = useState(readSession)
  const [profile, setProfile] = useState(null)
  const [profileForm, setProfileForm] = useState({ FullName: '', MobileNumber: '' })
  const [registration, setRegistration] = useState({
    FullName: '',
    MobileNumber: '',
    Email: '',
    Password: '',
  })
  const [registrationOtp, setRegistrationOtp] = useState('')
  const [registrationOtpSent, setRegistrationOtpSent] = useState(false)
  const [resetForm, setResetForm] = useState({ MobileNumber: '', Otp: '', NewPassword: '' })
  const [resetOtpSent, setResetOtpSent] = useState(false)
  const [credentials, setCredentials] = useState({ Email: '', Password: '' })
  const [passwords, setPasswords] = useState({ OldPassword: '', NewPassword: '' })
  const [loadingProfile, setLoadingProfile] = useState(() =>
    window.location.pathname.startsWith('/account') && Boolean(readSession()?.token),
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const isRegister = path === '/customer/register'
  const isForgotPassword = path === '/customer/forgot-password'
  const isAccount = path.startsWith('/account') && Boolean(session?.token)
  const accountSection = path === '/account/addresses'
    ? 'addresses'
    : path === '/account/orders'
      ? 'orders'
      : path === '/account/returns'
        ? 'returns'
      : path === '/account/notifications'
        ? 'notifications'
      : path === '/account/reviews'
        ? 'reviews'
      : 'profile'

  const navigate = useCallback((nextPath, { replace = false } = {}) => {
    if (window.location.pathname !== nextPath) {
      window.history[replace ? 'replaceState' : 'pushState'](null, '', nextPath)
    }
    if (nextPath === '/account') setLoadingProfile(true)
    setPath(nextPath)
    setError('')
    setNotice('')
  }, [])

  useEffect(() => {
    if (path.startsWith('/account') && !session?.token) {
      sessionStorage.setItem(CUSTOMER_RETURN_TO_KEY, path)
    }
  }, [path, session?.token])

  useEffect(() => {
    function handlePopState() {
      if (window.location.pathname === '/account') setLoadingProfile(true)
      setPath(window.location.pathname)
      setError('')
      setNotice('')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!isAccount || accountSection !== 'profile') return
    let active = true
    getCustomerProfile(session.token)
      .then((payload) => {
        if (!active) return
        const customer = payload?.data
        if (!customer || typeof customer !== 'object') {
          throw new Error('Profile response is missing customer details.')
        }
        setProfile(customer)
        setProfileForm({
          FullName: customer.FullName || '',
          MobileNumber: customer.MobileNumber || '',
        })
      })
      .catch((requestError) => {
        if (!active) return
        if (requestError.status === 401) {
          sessionStorage.removeItem(CUSTOMER_SESSION_KEY)
          setSession(null)
          navigate('/customer/login', { replace: true })
          setError('Session expire ho gaya. Dobara login karein.')
        } else {
          setError(requestError.message)
        }
      })
      .finally(() => {
        if (active) setLoadingProfile(false)
      })

    return () => {
      active = false
    }
  }, [accountSection, isAccount, navigate, session?.token])

  async function handleRegister(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      if (!registrationOtpSent) {
        await sendRegistrationOtp(registration)
        setRegistrationOtpSent(true)
        setNotice(`OTP ${registration.MobileNumber} par bheja gaya. Account banane ke liye OTP verify karein.`)
        return
      }

      const payload = await verifyRegistrationOtp({ ...registration, Otp: registrationOtp })
      const data = payload?.data
      if (!data?.token) throw new Error('Verified registration response mein sign-in token nahi mila.')
      sessionStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify({
        token: data.token,
        customer: data.customer || null,
      }))
      window.location.assign(consumeCustomerReturnPath())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLogin(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      const payload = await loginCustomer(credentials)
      const data = payload?.data
      if (!data?.token) throw new Error('Login response mein customer token nahi mila.')
      const nextSession = { token: data.token, customer: data.customer || null }
      sessionStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(nextSession))
      setSession(nextSession)
      setProfile(data.customer || null)
      window.location.assign(consumeCustomerReturnPath())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleForgotPassword(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      if (!resetOtpSent) {
        await sendPasswordResetOtp(resetForm.MobileNumber)
        setResetOtpSent(true)
        setNotice('Agar is mobile number se account linked hai, OTP SMS se bhej diya gaya hai.')
        return
      }

      await resetPasswordWithOtp(resetForm)
      setResetForm({ MobileNumber: '', Otp: '', NewPassword: '' })
      setResetOtpSent(false)
      navigate('/customer/login', { replace: true })
      setNotice('Password reset ho gaya. Naye password se sign in karein.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function resendRegistrationOtp() {
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      await sendRegistrationOtp(registration)
      setNotice('Naya OTP aapke mobile par bheja gaya.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleProfileUpdate(event) {
    event.preventDefault()
    if (!session?.token) return
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      const payload = await updateCustomerProfile(session.token, profileForm)
      if (payload?.data) {
        setProfile(payload.data)
        setProfileForm({
          FullName: payload.data.FullName || '',
          MobileNumber: payload.data.MobileNumber || '',
        })
      } else {
        const refreshed = await getCustomerProfile(session.token)
        setProfile(refreshed.data)
        setProfileForm({
          FullName: refreshed.data?.FullName || '',
          MobileNumber: refreshed.data?.MobileNumber || '',
        })
      }
      setNotice('Profile update ho gaya.')
    } catch (requestError) {
      if (requestError.status === 401) {
        sessionStorage.removeItem(CUSTOMER_SESSION_KEY)
        setSession(null)
        navigate('/customer/login', { replace: true })
      } else {
        setError(requestError.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault()
    if (!session?.token) return
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      await changeCustomerPassword(session.token, passwords)
      setPasswords({ OldPassword: '', NewPassword: '' })
      setNotice('Password change ho gaya.')
    } catch (requestError) {
      if (requestError.status === 401 && requestError.message.toLowerCase().includes('token')) {
        sessionStorage.removeItem(CUSTOMER_SESSION_KEY)
        setSession(null)
        navigate('/customer/login', { replace: true })
      } else {
        setError(requestError.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  function logout() {
    sessionStorage.removeItem(CUSTOMER_SESSION_KEY)
    setSession(null)
    setProfile(null)
    window.location.assign('/')
  }

  return (
    <main className="customer-page">
      <header className="customer-header">
        <a className="customer-brand" href="/shop">
          <span aria-hidden="true" className="customer-brand-mark">J</span>
          <span><strong>Jaysha Carpet</strong><small>HANDWOVEN HOME</small></span>
        </a>
        <nav aria-label="Customer navigation" className="customer-nav">
          <a href="/shop">Shop collection</a>
          {isAccount
            ? <><a href="/account/orders" onClick={(event) => {
              event.preventDefault()
              navigate('/account/orders')
            }}>My orders</a><button onClick={logout} type="button">Sign out</button></>
            : <a className="customer-nav-strong" href="/customer/login" onClick={(event) => {
              event.preventDefault()
              navigate('/customer/login')
            }}>My account</a>}
        </nav>
      </header>

      <section className={`customer-main${isAccount ? ' customer-main-account' : ''}${isForgotPassword ? ' customer-main-forgot' : ''}`}>
        <div className="customer-story">
          <span className="customer-eyebrow">{isAccount ? 'YOUR PERSONAL SPACE' : isForgotPassword ? 'ACCOUNT RECOVERY' : 'MADE TO FEEL LIKE HOME'}</span>
          <h1>{isAccount
            ? <>Your home,<br /><em>your collection.</em></>
            : isForgotPassword
              ? <>Back to your<br /><em>account.</em></>
              : <>A little more comfort,<br /><em>starts here.</em></>}</h1>
          <p>{isAccount
            ? 'Apni details manage karein aur apne account ko up to date rakhein.'
            : isForgotPassword
              ? 'Apne verified mobile number par aaya OTP use karke password reset karein.'
              : 'Create an account to make your shopping experience feel a little more personal.'}</p>
          <div aria-hidden="true" className="customer-rug-art">
            <span className="customer-rug-medallion" />
            <span className="customer-rug-label">WOVEN<br />WITH CARE</span>
          </div>
          <span className="customer-story-note">THOUGHTFULLY WOVEN · CAREFULLY MADE</span>
        </div>

        <section aria-labelledby="customer-panel-title" className="customer-panel">
          {isAccount ? (
            <>
              <span className="customer-panel-kicker">ACCOUNT SETTINGS</span>
              <h2 id="customer-panel-title">Welcome{profile?.FullName ? `, ${profile.FullName.split(' ')[0]}` : ' back'}</h2>
              <p className="customer-panel-description">Your details, all in one place.</p>
              <nav aria-label="Account sections" className="commerce-tabs">
                <a aria-current={accountSection === 'profile' ? 'page' : undefined} className={accountSection === 'profile' ? 'active' : ''} href="/account" onClick={(event) => {
                  event.preventDefault()
                  navigate('/account')
                }}>Profile</a>
                <a aria-current={accountSection === 'addresses' ? 'page' : undefined} className={accountSection === 'addresses' ? 'active' : ''} href="/account/addresses" onClick={(event) => {
                  event.preventDefault()
                  navigate('/account/addresses')
                }}>Addresses</a>
                <a aria-current={accountSection === 'orders' ? 'page' : undefined} className={accountSection === 'orders' ? 'active' : ''} href="/account/orders" onClick={(event) => {
                  event.preventDefault()
                  navigate('/account/orders')
                }}>Orders</a>
                <a aria-current={accountSection === 'returns' ? 'page' : undefined} className={accountSection === 'returns' ? 'active' : ''} href="/account/returns" onClick={(event) => {
                  event.preventDefault()
                  navigate('/account/returns')
                }}>Returns</a>
                <a aria-current={accountSection === 'reviews' ? 'page' : undefined} className={accountSection === 'reviews' ? 'active' : ''} href="/account/reviews" onClick={(event) => {
                  event.preventDefault()
                  navigate('/account/reviews')
                }}>Reviews</a>
                <a aria-current={accountSection === 'notifications' ? 'page' : undefined} className={accountSection === 'notifications' ? 'active' : ''} href="/account/notifications" onClick={(event) => {
                  event.preventDefault()
                  navigate('/account/notifications')
                }}>Notifications</a>
              </nav>
              {accountSection !== 'profile' ? (
                <CustomerCommercePanel section={accountSection} token={session.token} />
              ) : loadingProfile ? (
                <p aria-live="polite" className="customer-loading">Your account is loading...</p>
              ) : (
                <div className="customer-account-grid">
                  <form className="customer-form" onSubmit={handleProfileUpdate}>
                    <h3>Personal details</h3>
                    <label className="customer-field" htmlFor="profile-name">Full name
                      <input autoComplete="name" id="profile-name" maxLength={150} onChange={(event) => setProfileForm({ ...profileForm, FullName: event.target.value })} required value={profileForm.FullName} />
                    </label>
                    <label className="customer-field" htmlFor="profile-mobile">Mobile number
                      <input autoComplete="tel" id="profile-mobile" maxLength={20} onChange={(event) => setProfileForm({ ...profileForm, MobileNumber: event.target.value })} required value={profileForm.MobileNumber} />
                    </label>
                    <label className="customer-field" htmlFor="profile-email">Email address
                      <input autoComplete="email" id="profile-email" readOnly value={profile?.Email || ''} />
                    </label>
                    <button className="customer-submit" disabled={submitting} type="submit">{submitting ? 'Saving...' : 'Save changes'}</button>
                  </form>

                  <form className="customer-form customer-password-form" onSubmit={handlePasswordChange}>
                    <h3>Change password</h3>
                    <label className="customer-field" htmlFor="old-password">Current password
                      <input autoComplete="current-password" id="old-password" onChange={(event) => setPasswords({ ...passwords, OldPassword: event.target.value })} required type="password" value={passwords.OldPassword} />
                    </label>
                    <label className="customer-field" htmlFor="new-password">New password
                      <input autoComplete="new-password" id="new-password" minLength={8} onChange={(event) => setPasswords({ ...passwords, NewPassword: event.target.value })} required type="password" value={passwords.NewPassword} />
                    </label>
                    <button className="customer-submit customer-submit-secondary" disabled={submitting} type="submit">{submitting ? 'Updating...' : 'Update password'}</button>
                  </form>
                </div>
              )}
            </>
          ) : isForgotPassword ? (
            <>
              <span className="customer-panel-kicker">RESET YOUR PASSWORD</span>
              <h2 id="customer-panel-title">{resetOtpSent ? 'Enter your verification code' : 'Forgot your password?'}</h2>
              <p className="customer-panel-description">
                {resetOtpSent
                  ? 'Apne mobile par mila 6-digit code aur naya password enter karein.'
                  : 'We’ll send a one-time code to the mobile number linked to your account.'}
              </p>
              <form className="customer-form" onSubmit={handleForgotPassword}>
                <label className="customer-field" htmlFor="reset-mobile">Mobile number
                  <input
                    autoComplete="tel"
                    disabled={resetOtpSent}
                    id="reset-mobile"
                    maxLength={20}
                    onChange={(event) => setResetForm({ ...resetForm, MobileNumber: event.target.value })}
                    required
                    type="tel"
                    value={resetForm.MobileNumber}
                  />
                </label>
                {resetOtpSent && (
                  <>
                    <label className="customer-field" htmlFor="reset-otp">6-digit OTP
                      <input
                        autoComplete="one-time-code"
                        autoFocus
                        id="reset-otp"
                        inputMode="numeric"
                        maxLength={6}
                        onChange={(event) => setResetForm({ ...resetForm, Otp: event.target.value.replace(/\D/g, '').slice(0, 6) })}
                        pattern="[0-9]{6}"
                        required
                        value={resetForm.Otp}
                      />
                    </label>
                    <label className="customer-field" htmlFor="reset-new-password">New password
                      <input
                        autoComplete="new-password"
                        id="reset-new-password"
                        maxLength={72}
                        minLength={8}
                        onChange={(event) => setResetForm({ ...resetForm, NewPassword: event.target.value })}
                        required
                        type="password"
                        value={resetForm.NewPassword}
                      />
                    </label>
                  </>
                )}
                {error && <p className="customer-message customer-message-error" role="alert">{error}</p>}
                {notice && <p className="customer-message customer-message-success" role="status">{notice}</p>}
                <button className="customer-submit" disabled={submitting} type="submit">
                  {submitting ? 'Please wait...' : resetOtpSent ? 'Reset password' : 'Send OTP'}
                </button>
                {resetOtpSent && (
                  <button
                    className="customer-text-button"
                    disabled={submitting}
                    onClick={() => {
                      setResetOtpSent(false)
                      setResetForm({ ...resetForm, Otp: '', NewPassword: '' })
                      setNotice('')
                      setError('')
                    }}
                    type="button"
                  >
                    Use a different mobile number
                  </button>
                )}
              </form>
              <p className="customer-switch">
                Remembered it?
                <a href="/customer/login" onClick={(event) => {
                  event.preventDefault()
                  navigate('/customer/login')
                }}> Back to sign in</a>
              </p>
            </>
          ) : (
            <>
              <span className="customer-panel-kicker">{isRegister ? 'JOIN OUR COMMUNITY' : 'WELCOME BACK'}</span>
              <h2 id="customer-panel-title">{isRegister ? 'Create your account' : 'Sign in to your account'}</h2>
              <p className="customer-panel-description">{isRegister
                ? registrationOtpSent
                  ? 'Verify your mobile number to finish setting up your account.'
                  : 'Save your details for a smoother shopping experience.'
                : 'Pick up right where you left off.'}</p>

              <form className="customer-form" onSubmit={isRegister ? handleRegister : handleLogin}>
                {isRegister && (
                  <>
                    <label className="customer-field" htmlFor="customer-name">Full name
                      <input autoComplete="name" autoFocus disabled={registrationOtpSent} id="customer-name" maxLength={150} onChange={(event) => setRegistration({ ...registration, FullName: event.target.value })} required value={registration.FullName} />
                    </label>
                    <label className="customer-field" htmlFor="customer-mobile">Mobile number
                      <input autoComplete="tel" disabled={registrationOtpSent} id="customer-mobile" maxLength={20} onChange={(event) => setRegistration({ ...registration, MobileNumber: event.target.value })} required type="tel" value={registration.MobileNumber} />
                    </label>
                  </>
                )}
                <label className="customer-field" htmlFor="customer-email">Email address
                  <input autoComplete="email" autoFocus={!isRegister} disabled={isRegister && registrationOtpSent} id="customer-email" maxLength={150} onChange={(event) => isRegister
                    ? setRegistration({ ...registration, Email: event.target.value })
                    : setCredentials({ ...credentials, Email: event.target.value })} required type="email" value={isRegister ? registration.Email : credentials.Email} />
                </label>
                <label className="customer-field" htmlFor="customer-password">Password
                  <input autoComplete={isRegister ? 'new-password' : 'current-password'} disabled={isRegister && registrationOtpSent} id="customer-password" maxLength={isRegister ? 72 : undefined} minLength={isRegister ? 8 : undefined} onChange={(event) => isRegister
                    ? setRegistration({ ...registration, Password: event.target.value })
                    : setCredentials({ ...credentials, Password: event.target.value })} required type="password" value={isRegister ? registration.Password : credentials.Password} />
                  {isRegister && <small>Use at least 8 characters.</small>}
                </label>
                {isRegister && registrationOtpSent && (
                  <label className="customer-field" htmlFor="registration-otp">6-digit OTP
                    <input
                      autoComplete="one-time-code"
                      autoFocus
                      id="registration-otp"
                      inputMode="numeric"
                      maxLength={6}
                      onChange={(event) => setRegistrationOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      pattern="[0-9]{6}"
                      required
                      value={registrationOtp}
                    />
                  </label>
                )}
                {error && <p className="customer-message customer-message-error" role="alert">{error}</p>}
                {notice && <p className="customer-message customer-message-success" role="status">{notice}</p>}
                <button className="customer-submit" disabled={submitting} type="submit">
                  {submitting ? 'Please wait...' : isRegister
                    ? registrationOtpSent ? 'Verify OTP & create account' : 'Send OTP'
                    : 'Sign in'}
                </button>
                {isRegister && registrationOtpSent && (
                  <div className="customer-otp-actions">
                    <button className="customer-text-button" disabled={submitting} onClick={resendRegistrationOtp} type="button">Resend OTP</button>
                    <button className="customer-text-button" disabled={submitting} onClick={() => {
                      setRegistrationOtpSent(false)
                      setRegistrationOtp('')
                      setNotice('')
                      setError('')
                    }} type="button">Edit details</button>
                  </div>
                )}
                {!isRegister && (
                  <a className="customer-forgot-link" href="/customer/forgot-password" onClick={(event) => {
                    event.preventDefault()
                    navigate('/customer/forgot-password')
                  }}>Forgot password?</a>
                )}
              </form>

              <p className="customer-switch">
                {isRegister ? 'Already have an account?' : 'New to Jaysha Carpet?'}
                <a href={isRegister ? '/customer/login' : '/customer/register'} onClick={(event) => {
                  event.preventDefault()
                  navigate(isRegister ? '/customer/login' : '/customer/register')
                }}>{isRegister ? ' Sign in' : ' Create an account'}</a>
              </p>
            </>
          )}

          {isAccount && error && <p className="customer-message customer-message-error" role="alert">{error}</p>}
          {isAccount && notice && <p className="customer-message customer-message-success" role="status">{notice}</p>}
          <a className="customer-back-link" href="/shop">← Continue browsing the collection</a>
        </section>
      </section>
      <footer className="customer-footer">Thoughtfully woven. Made to feel like home.</footer>
    </main>
  )
}

export default CustomerPage
