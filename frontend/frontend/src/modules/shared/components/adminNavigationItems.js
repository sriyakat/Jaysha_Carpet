export const adminNavigationGroups = [
  {
    label: 'Workspace',
    items: [
      ['dashboard', 'Overview', 'grid'],
    ],
  },
  {
    label: 'Catalog',
    items: [
      ['products', 'Products', 'box'],
      ['categories', 'Categories', 'category'],
      ['variants', 'Product variants', 'box'],
      ['videos', 'Product videos', 'image'],
      ['banners', 'Homepage banners', 'image'],
      ['new-arrivals', 'Homepage new arrivals', 'image'],
      ['custom-orders', 'Custom carpet requests', 'box'],
      ['showcase', 'Homepage showcase', 'image'],
      ['inspiration', 'Homepage inspiration', 'image'],
      ['offer', 'Homepage offer', 'image'],
      ['blog', 'Blog & journal', 'edit'],
    ],
  },
  {
    label: 'Sales & customers',
    items: [
      ['orders', 'Orders', 'box'],
      ['customers', 'Customers', 'category'],
      ['customer-addresses', 'Customer addresses', 'category', 'customers'],
      ['payments', 'Payments', 'sparkle'],
      ['inventory', 'Inventory', 'box'],
      ['coupons', 'Coupons & offers', 'sparkle'],
      ['returns', 'Returns & refunds', 'box'],
    ],
  },
  {
    label: 'Engagement & insights',
    items: [
      ['reviews', 'Reviews', 'sparkle'],
      ['notifications', 'Notifications', 'sparkle'],
      ['reports', 'Sales reports', 'grid'],
    ],
  },
  {
    label: 'Administration',
    items: [
      ['admin-users', 'Admin users / roles', 'category', null, false],
      ['settings', 'Settings', 'edit'],
    ],
  },
]
