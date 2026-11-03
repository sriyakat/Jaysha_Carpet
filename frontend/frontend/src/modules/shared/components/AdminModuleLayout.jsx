import Icon from '../../category/components/Icon.jsx'
import AdminNavigation from './AdminNavigation.jsx'

function AdminModuleLayout({ activeModule, title, user, onLogout, onNavigate, children }) {
  const name = user?.fullName || user?.FullName || 'Jaysha Carpet admin'
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          aria-label="Jaysha Carpet admin home"
          className="brand"
          href="/admin"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('dashboard')
          }}
        >
          <span className="brand-mark"><Icon name="grid" size={20} /></span>
          <span><span className="brand-name">Jaysha Carpet</span><span className="brand-caption">STORE ADMIN</span></span>
        </a>
        <AdminNavigation activeModule={activeModule} onNavigate={onNavigate} />
        <div className="sidebar-spacer" />
        <div className="sidebar-note">
          <h2 className="sidebar-note-title">Store control center</h2>
          <p>Manage your catalog, customer activity, and storefront settings.</p>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><Icon name="arrow" size={13} /><strong>{title}</strong></div>
          <div className="topbar-right">
            <span className="topbar-date">Store administration</span>
            <span aria-label={name} className="avatar">{initials}</span>
            <button className="logout-button" onClick={onLogout} type="button">Sign out</button>
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}

export default AdminModuleLayout
