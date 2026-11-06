import { useEffect } from 'react'
import Icon from '../../category/components/Icon.jsx'
import { getProductImageUrl } from '../api/productApi.js'

function readProduct(product, camelName, pascalName, fallback = '') {
  return product?.[camelName] ?? product?.[pascalName] ?? fallback
}

function formatPrice(value) {
  const price = Number(value)
  return Number.isFinite(price)
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(price)
    : '—'
}

function ProductManagementSidebar({
  product,
  busy,
  onClose,
  onManageImages,
  onManageSizes,
  onEdit,
  onToggle,
  onDelete,
  onCoupons,
}) {
  const name = readProduct(product, 'productName', 'ProductName', 'Product')
  const sku = readProduct(product, 'sku', 'SKU', '—')
  const image = readProduct(product, 'primaryImage', 'PrimaryImage')
  const price = readProduct(product, 'price', 'Price')
  const discountPrice = readProduct(product, 'discountPrice', 'DiscountPrice')
  const hasOffer = discountPrice !== null && discountPrice !== undefined && discountPrice !== ''
  const isActive = Boolean(readProduct(product, 'isActive', 'IsActive', true))

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="product-management-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <aside
        aria-labelledby="product-management-title"
        aria-modal="true"
        className="product-management-sidebar"
        role="dialog"
      >
        <header className="product-management-header">
          <div>
            <p className="eyebrow"><span className="eyebrow-dot" /> PRODUCT TOOLS</p>
            <h2 id="product-management-title">Manage listing</h2>
          </div>
          <button aria-label="Close product tools" className="icon-button" onClick={onClose} type="button">
            <Icon name="close" />
          </button>
        </header>

        <div className="product-management-content">
          <section className="product-management-summary">
            <span className="product-management-image">
              {image ? <img alt="" src={getProductImageUrl(image)} /> : <Icon name="box" size={24} />}
            </span>
            <div>
              <h3>{name}</h3>
              <p>SKU: {sku}</p>
              <span className={`status-badge${isActive ? ' active' : ''}`}>{isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </section>

          <section className="product-management-section">
            <h3>Offer price</h3>
            <div className="product-management-prices">
              <span>Regular price <strong>{formatPrice(price)}</strong></span>
              <span>Offer price <strong>{hasOffer ? formatPrice(discountPrice) : 'Not set'}</strong></span>
            </div>
            <button className="product-management-action" disabled={busy} onClick={onEdit} type="button">
              <Icon name="edit" size={17} />
              <span><strong>{hasOffer ? 'Update offer price' : 'Add offer price'}</strong><small>Edit product pricing and details</small></span>
              <Icon name="arrow" size={16} />
            </button>
          </section>

          <section className="product-management-section">
            <h3>Product content</h3>
            <button className="product-management-action" disabled={busy} onClick={onManageImages} type="button">
              <Icon name="image" size={18} />
              <span><strong>Product images</strong><small>Upload, reorder, and choose a primary photo</small></span>
              <Icon name="arrow" size={16} />
            </button>
            <button className="product-management-action" disabled={busy} onClick={onManageSizes} type="button">
              <Icon name="box" size={18} />
              <span><strong>Sizes &amp; videos</strong><small>Manage size pricing, stock, and video links</small></span>
              <Icon name="arrow" size={16} />
            </button>
          </section>

          <section className="product-management-section">
            <h3>Coupons &amp; offers</h3>
            <p className="product-management-note">Coupon codes are managed for the store and applied at checkout. Product-specific coupon assignment is not available.</p>
            <button className="product-management-action" disabled={busy} onClick={onCoupons} type="button">
              <Icon name="sparkle" size={18} />
              <span><strong>Manage store coupons</strong><small>Create and manage discount codes</small></span>
              <Icon name="arrow" size={16} />
            </button>
          </section>

          <section className="product-management-section product-management-footer">
            <button className="secondary-button" disabled={busy} onClick={onToggle} type="button">
              {isActive ? 'Deactivate listing' : 'Activate listing'}
            </button>
            <button className="secondary-button product-management-delete" disabled={busy} onClick={onDelete} type="button">
              <Icon name="trash" size={16} /> Delete product
            </button>
          </section>
        </div>
      </aside>
    </div>
  )
}

export default ProductManagementSidebar
