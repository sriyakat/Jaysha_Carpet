import Icon from '../../category/components/Icon.jsx'
import { adminNavigationGroups } from './adminNavigationItems.js'

function AdminNavigation({ activeModule, collapsed, onSelect }) {
  return (
    <nav aria-label="Main navigation" className="admin-navigation">
      {adminNavigationGroups.map((group) => (
        <section className="admin-navigation-group" key={group.label}>
          <p className="nav-label">{group.label}</p>
          {group.items.map(([module, label, icon, navigateModule = module, available = true]) => {
            const active = activeModule === module
            return (
              available ? (
                <button
                  aria-current={active ? 'page' : undefined}
                  aria-label={collapsed ? label : undefined}
                  className={`nav-item${active ? ' active' : ''}`}
                  key={module}
                  onClick={() => onSelect(navigateModule)}
                  title={collapsed ? label : undefined}
                  type="button"
                >
                  <Icon name={icon} size={18} />
                  <span className="nav-item-label">{label}</span>
                </button>
              ) : (
                <div
                  aria-disabled="true"
                  aria-label={collapsed ? `${label}, not available yet` : undefined}
                  className="nav-item unavailable"
                  key={module}
                  title={`${label} — not available yet`}
                >
                  <Icon name={icon} size={18} />
                  <span className="nav-item-label">{label}</span>
                  {!collapsed && <small className="nav-coming-soon">Soon</small>}
                </div>
              )
            )
          })}
        </section>
      ))}
    </nav>
  )
}

export default AdminNavigation
