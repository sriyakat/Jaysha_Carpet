import Icon from '../../category/components/Icon.jsx'

const items = [
  ['dashboard', '/admin', 'Overview', 'grid'],
  ['categories', '/admin/categories', 'Categories', 'category'],
  ['products', '/admin/products', 'Product listing', 'box'],
  ['orders', '/admin/orders', 'Orders', 'box'],
  ['inventory', '/admin/inventory', 'Inventory', 'box'],
  ['payments', '/admin/payments', 'Payments', 'sparkle'],
  ['customers', '/admin/customers', 'Customers', 'category'],
  ['returns', '/admin/returns', 'Returns & refunds', 'box'],
  ['coupons', '/admin/coupons', 'Coupons & offers', 'sparkle'],
  ['banners', '/admin/banners', 'Homepage banners', 'image'],
  ['reports', '/admin/reports', 'Sales reports', 'grid'],
  ['reviews', '/admin/reviews', 'Reviews', 'sparkle'],
  ['notifications', '/admin/notifications', 'Notifications', 'sparkle'],
  ['settings', '/admin/website-settings', 'Website settings', 'edit'],
]

function AdminNavigation({ activeModule, onNavigate }) {
  return (
    <>
      <p className="nav-label">Workspace</p>
      <nav aria-label="Main navigation">
        {items.map(([module, href, label, icon]) => (
          <a
            aria-current={activeModule === module ? 'page' : undefined}
            className={`nav-item${activeModule === module ? ' active' : ''}`}
            href={href}
            key={module}
            onClick={(event) => {
              event.preventDefault()
              onNavigate(module)
            }}
          >
            <Icon name={icon} size={18} />
            {label}
          </a>
        ))}
      </nav>
    </>
  )
}

export default AdminNavigation
