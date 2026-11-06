import { useEffect, useMemo, useState } from 'react'
import Icon from '../../category/components/Icon.jsx'
import AdminNavigation from './AdminNavigation.jsx'
import { adminNavigationGroups } from './adminNavigationItems.js'

const searchableItems = adminNavigationGroups.flatMap((group) => group.items
  .filter(([, , , , available = true]) => available)
  .map(([module, label]) => ({ module, label })))

function AdminModuleLayout({ activeModule, title, user, onLogout, onNavigate, children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches)
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [currentYear] = useState(() => new Date().getFullYear())
  const name = user?.fullName || user?.FullName || 'Jaysha Carpet admin'
  const email = user?.email || user?.Email || ''
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const matches = useMemo(() => {
    const query = search.trim().toLowerCase()
    return query ? searchableItems.filter((item) => item.label.toLowerCase().includes(query)).slice(0, 6) : []
  }, [search])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 760px)')
    function updateViewportMode() {
      setIsMobile(mediaQuery.matches)
      if (!mediaQuery.matches) setMobileOpen(false)
    }
    updateViewportMode()
    mediaQuery.addEventListener('change', updateViewportMode)
    return () => mediaQuery.removeEventListener('change', updateViewportMode)
  }, [])

  function navigate(module) {
    onNavigate(module)
    setMobileOpen(false)
    setSearch('')
    setSearchOpen(false)
    setProfileOpen(false)
  }

  return (
    <div className={`app-shell${collapsed ? ' is-sidebar-collapsed' : ''}${mobileOpen ? ' is-mobile-menu-open' : ''}`}>
      {mobileOpen && <button aria-label="Close navigation" className="admin-sidebar-scrim" onClick={() => setMobileOpen(false)} type="button" />}
      <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
        <a
          aria-label="Jaysha Carpet admin home"
          className="brand"
          href="/admin"
          onClick={(event) => {
            event.preventDefault()
            navigate('dashboard')
          }}
        >
          <span className="brand-mark"><Icon name="grid" size={20} /></span>
          <span className="brand-wordmark"><span className="brand-name">Jaysha Carpet</span><span className="brand-caption">STORE ADMIN</span></span>
        </a>
        <AdminNavigation activeModule={activeModule} collapsed={collapsed} onSelect={navigate} />
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <h2 className="sidebar-note-title">Store control center</h2>
            <p>Manage your catalog, customer activity, and storefront settings.</p>
          </div>
          <button className="admin-sidebar-logout" onClick={onLogout} type="button">
            <span aria-hidden="true">↗</span><span className="nav-item-label">Sign out</span>
          </button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-leading">
            <button
              aria-expanded={isMobile ? mobileOpen : !collapsed}
              aria-label={isMobile
                ? mobileOpen ? 'Close navigation' : 'Open navigation'
                : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="topbar-menu-toggle"
              onClick={() => {
                if (window.matchMedia('(max-width: 760px)').matches) {
                  setCollapsed(false)
                  setMobileOpen((open) => !open)
                } else {
                  setMobileOpen(false)
                  setCollapsed((value) => !value)
                }
              }}
              type="button"
            >
              <span aria-hidden="true">☰</span>
            </button>
            <div className="breadcrumb"><span>Workspace</span><Icon name="arrow" size={13} /><strong>{title}</strong></div>
          </div>
          <div className="topbar-right">
            <div className={`admin-global-search${searchOpen ? ' is-open' : ''}`}>
              <Icon name="search" size={17} />
              <input
                aria-label="Search admin sections"
                aria-expanded={searchOpen && matches.length > 0}
                onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
                onChange={(event) => setSearch(event.target.value)}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && matches[0]) navigate(matches[0].module)
                  if (event.key === 'Escape') {
                    setSearch('')
                    setSearchOpen(false)
                  }
                }}
                placeholder="Search sections..."
                value={search}
              />
              {searchOpen && matches.length > 0 && (
                <div className="admin-search-results" role="listbox">
                  {matches.map((item) => (
                    <button key={item.module} onMouseDown={(event) => event.preventDefault()} onClick={() => navigate(item.module)} role="option" type="button">
                      <Icon name="search" size={14} />{item.label}<span>Enter ↵</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button aria-label="Open notifications" className="admin-icon-button" onClick={() => navigate('notifications')} type="button">
              <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>
            </button>
            <div className="admin-profile-wrap">
              <button aria-expanded={profileOpen} className="admin-profile-trigger" onClick={() => setProfileOpen((open) => !open)} type="button">
                <span aria-label={name} className="avatar">{initials}</span>
                <span className="admin-profile-copy"><strong>{name}</strong><small>Store administrator</small></span>
                <span aria-hidden="true" className="admin-profile-chevron">⌄</span>
              </button>
              {profileOpen && (
                <div className="admin-profile-menu">
                  {email && <span className="admin-profile-email">{email}</span>}
                  <button onClick={() => navigate('settings')} type="button">Store settings</button>
                  <button onClick={onLogout} type="button">Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>
        {children}
        <footer className="admin-app-footer"><span>Jaysha Carpet Admin</span><span>© {currentYear} Jaysha Carpet</span></footer>
      </main>
    </div>
  )
}

export default AdminModuleLayout
