import './App.css'
import { lazy, Suspense, useState } from 'react'
import CategoriesPage from './modules/category/pages/CategoriesPage.jsx'
const ProductsPage = lazy(() => import('./modules/product/pages/ProductsPage.jsx'))
import ShopPage from './modules/cart/pages/ShopPage.jsx'
import StorePoliciesPage from './modules/cart/pages/StorePoliciesPage.jsx'
import AuthPage from './modules/auth/pages/AuthPage.jsx'
import CustomerPage from './modules/customer/pages/CustomerPage.jsx'
import OrdersPage from './modules/order/pages/OrdersPage.jsx'
import InventoryPage from './modules/inventory/pages/InventoryPage.jsx'
import PaymentsPage from './modules/payment/pages/PaymentsPage.jsx'
import ProductVariantsPage from './modules/productVariant/pages/ProductVariantsPage.jsx'
import NotificationsPage from './modules/notification/pages/NotificationsPage.jsx'
import ReviewsPage from './modules/review/pages/ReviewsPage.jsx'
import ProductVideosPage from './modules/productVideos/pages/ProductVideosPage.jsx'
import WebsiteSettingsPage from './modules/websiteSettings/pages/WebsiteSettingsPage.jsx'
const AdminDashboardPage = lazy(() => import('./modules/shared/components/AdminDashboardPage.jsx'))
import HomepageBannersPage from './modules/homepageBanners/pages/HomepageBannersPage.jsx'
import HomepageShowcasePage from './modules/homepageShowcase/pages/HomepageShowcasePage.jsx'
const HomepageNewArrivalsPage = lazy(() => import('./modules/homepageNewArrivals/pages/HomepageNewArrivalsPage.jsx'))
const CustomOrdersPage = lazy(() => import('./modules/customOrder/pages/CustomOrdersPage.jsx'))
const BlogPage = lazy(() => import('./modules/blog/pages/BlogPage.jsx'))
import SalesReportsPage from './modules/salesReport/pages/SalesReportsPage.jsx'
import CouponsPage from './modules/coupon/pages/CouponsPage.jsx'
import ReturnRequestsPage from './modules/returnRequest/pages/ReturnRequestsPage.jsx'
import AdminCustomersPage from './modules/customer/pages/AdminCustomersPage.jsx'

function getAppPathname() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')
  const pathname = window.location.pathname
  return basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))
    ? pathname.slice(basePath.length) || '/'
    : pathname
}

function App() {
  const pathname = getAppPathname()
  const [session, setSession] = useState(() => {
    try {
      const savedSession = sessionStorage.getItem('admin-session')
        || localStorage.getItem('admin-session')
      const parsedSession = JSON.parse(savedSession || 'null')
      if (parsedSession?.token && parsedSession?.user) {
        sessionStorage.setItem('admin-session', JSON.stringify(parsedSession))
        return parsedSession
      }
      return null
    } catch {
      sessionStorage.removeItem('admin-session')
      localStorage.removeItem('admin-session')
      return null
    }
  })
  const [authMode, setAuthMode] = useState(() =>
    pathname === '/setup-admin' ? 'setup' : 'login',
  )
  const [activeModule, setActiveModule] = useState(() =>
    ['/admin/products', '/products'].includes(pathname)
      ? 'products'
      : ({
        '/admin': 'dashboard',
        '/admin/categories': 'categories',
        '/admin/orders': 'orders',
        '/admin/inventory': 'inventory',
        '/admin/payments': 'payments',
        '/admin/customers': 'customers',
        '/admin/returns': 'returns',
        '/admin/coupons': 'coupons',
        '/admin/banners': 'banners',
        '/admin/new-arrivals': 'new-arrivals',
        '/admin/custom-orders': 'custom-orders',
        '/admin/showcase': 'showcase',
        '/admin/inspiration': 'inspiration',
        '/admin/offers': 'offer',
        '/admin/blog': 'blog',
        '/admin/reports': 'reports',
        '/admin/variants': 'variants',
        '/admin/reviews': 'reviews',
        '/admin/notifications': 'notifications',
        '/admin/product-videos': 'videos',
        '/admin/website-settings': 'settings',
      }[pathname] || 'categories'),
  )

  if (['/', '/shop', '/cart', '/checkout'].includes(pathname)) {
    return <ShopPage />
  }

  if (pathname.startsWith('/policies/')) {
    return <StorePoliciesPage />
  }

  if (
    ['/customer/login', '/customer/register', '/customer/forgot-password'].includes(pathname)
    || pathname.startsWith('/account')
  ) {
    return <CustomerPage />
  }

  function navigateToModule(module) {
    setActiveModule(module)
    const routes = {
      dashboard: '/admin',
      categories: '/admin/categories',
      products: '/admin/products',
      orders: '/admin/orders',
      inventory: '/admin/inventory',
      payments: '/admin/payments',
      customers: '/admin/customers',
      returns: '/admin/returns',
      coupons: '/admin/coupons',
      banners: '/admin/banners',
      'new-arrivals': '/admin/new-arrivals',
      'custom-orders': '/admin/custom-orders',
      showcase: '/admin/showcase',
      inspiration: '/admin/inspiration',
      offer: '/admin/offers',
      blog: '/admin/blog',
      reports: '/admin/reports',
      variants: '/admin/variants',
      reviews: '/admin/reviews',
      notifications: '/admin/notifications',
      videos: '/admin/product-videos',
      settings: '/admin/website-settings',
    }
    window.history.replaceState(null, '', routes[module] || routes.categories)
  }

  function handleLogin(data, rememberMe = false) {
    const nextSession = { token: data.token, user: data.user }
    sessionStorage.setItem('admin-session', JSON.stringify(nextSession))
    if (rememberMe) localStorage.setItem('admin-session', JSON.stringify(nextSession))
    else localStorage.removeItem('admin-session')
    setSession(nextSession)
    setActiveModule('dashboard')
    window.history.replaceState(null, '', '/admin')
  }

  function handleAdminCreated() {
    setAuthMode('login')
    window.history.replaceState(null, '', '/admin/login')
  }

  function handleLogout() {
    sessionStorage.removeItem('admin-session')
    localStorage.removeItem('admin-session')
    setSession(null)
    setAuthMode('login')
    window.history.replaceState(null, '', '/admin/login')
  }

  if (session?.token && session?.user) {
    if (activeModule === 'dashboard') {
      return (
        <Suspense fallback={<div role="status">Loading dashboard…</div>}>
          <AdminDashboardPage onLogout={handleLogout} onNavigate={navigateToModule} user={session.user} />
        </Suspense>
      )
    }
    if (activeModule === 'orders') {
      return <OrdersPage onLogout={handleLogout} onNavigate={navigateToModule} user={session.user} />
    }
    if (activeModule === 'inventory') {
      return <InventoryPage onLogout={handleLogout} onNavigate={navigateToModule} user={session.user} />
    }
    if (activeModule === 'payments') {
      return <PaymentsPage onLogout={handleLogout} onNavigate={navigateToModule} user={session.user} />
    }
    if (activeModule === 'variants') {
      return <ProductVariantsPage onLogout={handleLogout} onNavigate={navigateToModule} user={session.user} />
    }
    if (activeModule === 'reviews') {
      return <ReviewsPage onLogout={handleLogout} onNavigate={navigateToModule} user={session.user} />
    }
    if (activeModule === 'notifications') {
      return <NotificationsPage onLogout={handleLogout} onNavigate={navigateToModule} user={session.user} />
    }
    if (activeModule === 'videos') {
      return <ProductVideosPage onLogout={handleLogout} onNavigate={navigateToModule} user={session.user} />
    }
    if (activeModule === 'settings') {
      return <WebsiteSettingsPage onLogout={handleLogout} onNavigate={navigateToModule} user={session.user} />
    }
    if (activeModule === 'customers') {
      return <AdminCustomersPage onLogout={handleLogout} onNavigate={navigateToModule} user={session.user} />
    }
    if (activeModule === 'returns') {
      return <ReturnRequestsPage onLogout={handleLogout} onNavigate={navigateToModule} user={session.user} />
    }
    if (activeModule === 'coupons') {
      return <CouponsPage onLogout={handleLogout} onNavigate={navigateToModule} user={session.user} />
    }
    if (activeModule === 'banners') {
      return <HomepageBannersPage onLogout={handleLogout} onNavigate={navigateToModule} user={session.user} />
    }
    if (activeModule === 'new-arrivals') {
      return (
        <Suspense fallback={<div role="status">Loading New Arrivals management…</div>}>
          <HomepageNewArrivalsPage onLogout={handleLogout} onNavigate={navigateToModule} user={session.user} />
        </Suspense>
      )
    }
    if (activeModule === 'custom-orders') {
      return (
        <Suspense fallback={<div role="status">Loading custom order requests…</div>}>
          <CustomOrdersPage onLogout={handleLogout} onNavigate={navigateToModule} user={session.user} />
        </Suspense>
      )
    }
    if (activeModule === 'showcase') {
      return <HomepageShowcasePage onLogout={handleLogout} onNavigate={navigateToModule} user={session.user} />
    }
    if (activeModule === 'inspiration') {
      return <HomepageShowcasePage onLogout={handleLogout} onNavigate={navigateToModule} section="inspiration" user={session.user} />
    }
    if (activeModule === 'offer') {
      return <HomepageShowcasePage onLogout={handleLogout} onNavigate={navigateToModule} section="offer" user={session.user} />
    }
    if (activeModule === 'blog') {
      return (
        <Suspense fallback={<div role="status">Loading blog management…</div>}>
          <BlogPage onLogout={handleLogout} onNavigate={navigateToModule} user={session.user} />
        </Suspense>
      )
    }
    if (activeModule === 'reports') {
      return <SalesReportsPage onLogout={handleLogout} onNavigate={navigateToModule} user={session.user} />
    }
    if (activeModule === 'products') {
      return (
        <Suspense fallback={<div role="status">Loading product listings…</div>}>
          <ProductsPage onLogout={handleLogout} onNavigate={navigateToModule} user={session.user} />
        </Suspense>
      )
    }
    return <CategoriesPage onLogout={handleLogout} onNavigate={navigateToModule} user={session.user} />
  }

  return (
    <AuthPage
      key={authMode}
      mode={authMode}
      onAdminCreated={handleAdminCreated}
      onLogin={handleLogin}
    />
  )
}

export default App
