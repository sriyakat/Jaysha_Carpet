import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCategories } from '../../category/api/categoryApi.js'
import Icon from '../../category/components/Icon.jsx'
import AdminNavigation from '../../shared/components/AdminNavigation.jsx'
import ProductFormModal from '../components/ProductFormModal.jsx'
import ProductImagesModal from '../components/ProductImagesModal.jsx'
import ProductListingDetailsModal from '../components/ProductListingDetailsModal.jsx'
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProductImageUrl,
  getProducts,
  setProductStatus,
  updateProduct,
} from '../api/productApi.js'

function readValue(item, camelName, pascalName, fallback = '') {
  return item?.[camelName] ?? item?.[pascalName] ?? fallback
}

function productId(product) {
  return readValue(product, 'productId', 'ProductId', product?.id ?? product?.Id)
}

function formatPrice(value) {
  const price = Number(value)
  return Number.isFinite(price)
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(price)
    : '—'
}

function ProductsPage({ user, onLogout, onNavigate }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)
  const [imagesProduct, setImagesProduct] = useState(null)
  const [listingDetailsProduct, setListingDetailsProduct] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busyProductId, setBusyProductId] = useState(null)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setListError('')

    try {
      setProducts(await getProducts())
    } catch (error) {
      setListError(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    getProducts()
      .then((items) => {
        if (active) setProducts(items)
      })
      .catch((error) => {
        if (active) setListError(error.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    getCategories()
      .then((items) => {
        if (active) setCategories(items)
      })
      .catch((error) => {
        if (active) setCategoryError(error.message)
      })

    return () => {
      active = false
    }
  }, [])

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products.filter((product) => {
      const name = readValue(product, 'productName', 'ProductName')
      const sku = readValue(product, 'sku', 'SKU')
      const slug = readValue(product, 'slug', 'Slug')
      const categoryName = readValue(product, 'categoryName', 'CategoryName')
      const productCategoryId = String(readValue(product, 'categoryId', 'CategoryId'))
      const matchesQuery = `${name} ${sku} ${slug} ${categoryName}`.toLowerCase().includes(query)
      return matchesQuery && (!categoryFilter || productCategoryId === categoryFilter)
    })
  }, [products, search, categoryFilter])

  const activeCount = products.filter((item) => Boolean(readValue(item, 'isActive', 'IsActive', true))).length
  const featuredCount = products.filter((item) => Boolean(readValue(item, 'isFeatured', 'IsFeatured', false))).length
  const outOfStockCount = products.filter((item) => Number(readValue(item, 'stockQuantity', 'StockQuantity', 0)) <= 0).length

  function openCreateForm() {
    setActionError('')
    setFormError('')
    setEditingProduct(null)
    setIsAdding(true)
  }

  function closeForm() {
    if (saving) return
    setIsAdding(false)
    setEditingProduct(null)
    setFormError('')
  }

  function openImages(product) {
    const id = productId(product)
    if (id === undefined || id === null) {
      setActionError('Is product ka ID nahi mila, isliye images manage nahi ho sakti.')
      return
    }

    setActionError('')
    setImagesProduct(product)
  }

  async function openEditForm(product) {
    const id = productId(product)
    if (id === undefined || id === null) {
      setActionError('Is product ka ID nahi mila, isliye ise edit nahi kiya ja sakta.')
      return
    }

    setActionError('')
    setFormError('')
    setSaving(true)

    try {
      const details = await getProduct(id)
      if (!details?.product) throw new Error('Product details nahi milin.')
      setEditingProduct(details.product)
      setIsAdding(false)
    } catch (error) {
      setActionError(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function saveProduct(values) {
    setSaving(true)
    setFormError('')

    try {
      if (editingProduct) {
        await updateProduct(productId(editingProduct), values)
      } else {
        await createProduct(values)
      }

      setIsAdding(false)
      setEditingProduct(null)
      await loadProducts()
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function removeProduct(product) {
    const name = readValue(product, 'productName', 'ProductName', 'this product')
    const id = productId(product)
    if (id === undefined || id === null) {
      setActionError('Is product ka ID nahi mila, isliye ise delete nahi kiya ja sakta.')
      return
    }
    if (!window.confirm(`"${name}" ko delete karna chahte hain?`)) return

    setActionError('')
    setBusyProductId(id)
    try {
      await deleteProduct(id)
      await loadProducts()
    } catch (error) {
      setActionError(error.message)
    } finally {
      setBusyProductId(null)
    }
  }

  async function changeStatus(product) {
    const id = productId(product)
    if (id === undefined || id === null) {
      setActionError('Is product ka ID nahi mila, isliye status update nahi ho saka.')
      return
    }

    const currentStatus = Boolean(readValue(product, 'isActive', 'IsActive', true))
    setActionError('')
    setBusyProductId(id)
    try {
      await setProductStatus(id, !currentStatus)
      await loadProducts()
    } catch (error) {
      setActionError(error.message)
    } finally {
      setBusyProductId(null)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a aria-label="Jaysha Carpet admin home" className="brand" href="/admin" onClick={(event) => { event.preventDefault(); onNavigate('categories') }}>
          <span className="brand-mark"><Icon name="grid" size={20} /></span>
          <span>
            <span className="brand-name">Jaysha Carpet</span>
            <span className="brand-caption">STORE ADMIN</span>
          </span>
        </a>

        <AdminNavigation activeModule="products" onNavigate={onNavigate} />

        <div className="sidebar-spacer" />
        <div className="sidebar-note">
          <h2 className="sidebar-note-title">A catalog worth exploring</h2>
          <p>Keep product details and inventory up to date for your customers.</p>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <Icon name="arrow" size={13} />
            <strong>Product listing</strong>
          </div>
          <div className="topbar-right">
            <span className="topbar-date">Catalog management</span>
            <span aria-label={user?.fullName || 'Jaysha Carpet admin'} className="avatar">
              {(user?.fullName || 'JC').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
            </span>
            <button className="logout-button" onClick={onLogout} type="button">Sign out</button>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow"><span className="eyebrow-dot" /> CATALOG SETUP</p>
              <h1>Product listing</h1>
              <p>Product add karein, phir usi listing se photos, sizes aur video link manage karein.</p>
            </div>
            <button className="primary-button" onClick={openCreateForm} type="button">
              <Icon name="plus" size={17} />
              Add product
            </button>
            <div aria-hidden="true" className="hero-ornament">
              <span className="ornament-ring ring-one" />
              <span className="ornament-ring ring-two" />
              <span className="ornament-center"><Icon name="box" size={30} /></span>
            </div>
          </div>

          {(actionError || categoryError) && (
            <div className="page-error" role="alert">
              <Icon name="warning" size={17} />
              <span>{actionError || `Categories load nahi ho sakin: ${categoryError}`}</span>
            </div>
          )}

          <div className="overview-grid">
            <article className="overview-card">
              <span className="overview-icon"><Icon name="box" size={20} /></span>
              <div><p className="overview-label">Total products</p><p className="overview-value">{loading ? '—' : products.length}</p></div>
            </article>
            <article className="overview-card">
              <span className="overview-icon"><Icon name="sparkle" size={20} /></span>
              <div><p className="overview-label">Featured products</p><p className="overview-value">{loading ? '—' : featuredCount}</p></div>
            </article>
            <article className="overview-card">
              <span className="overview-icon"><Icon name="warning" size={20} /></span>
              <div><p className="overview-label">Out of stock</p><p className="overview-value">{loading ? '—' : outOfStockCount}</p></div>
            </article>
          </div>

          <ol aria-label="How to create a product listing" className="listing-setup-steps">
            <li><span>1</span><div><strong>Add product</strong><small>Product name, category and price</small></div></li>
            <li><span>2</span><div><strong>Add images</strong><small>Upload product photos</small></div></li>
            <li><span>3</span><div><strong>Add sizes &amp; video</strong><small>Set size-wise price, stock and video link</small></div></li>
          </ol>

          <section aria-label="Products" className="table-card">
            <div className="table-toolbar">
              <div>
                <h2 className="table-title">Your product listings</h2>
                <p className="table-subtitle">{activeCount} active in catalog</p>
              </div>
              <div className="product-filters">
                <label className="search-box">
                  <Icon name="search" size={16} />
                  <input
                    aria-label="Search products"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search products..."
                    type="search"
                    value={search}
                  />
                </label>
                <select
                  aria-label="Filter by category"
                  className="product-category-filter"
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  value={categoryFilter}
                >
                  <option value="">All categories</option>
                  {categories.map((category, index) => {
                    const id = readValue(category, 'categoryId', 'CategoryId', category?.id ?? category?.Id ?? index)
                    return <option key={id} value={id}>{readValue(category, 'categoryName', 'CategoryName', 'Unnamed category')}</option>
                  })}
                </select>
              </div>
            </div>

            {loading ? (
              <div aria-live="polite" className="loading-state"><span className="spinner" /><span>Products load ho rahe hain...</span></div>
            ) : listError ? (
              <div className="empty-state" role="alert">
                <span className="overview-icon"><Icon name="warning" size={21} /></span>
                <h3>Products load nahi ho sake</h3>
                <p>{listError}</p>
                <button className="secondary-button" onClick={loadProducts} type="button">Retry</button>
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="empty-state">
                <span className="overview-icon"><Icon name="box" size={21} /></span>
                <h3>{search.trim() || categoryFilter ? 'Koi matching product nahi mila' : 'Abhi products nahi hain'}</h3>
                <p>{search.trim() || categoryFilter ? 'Search ya category filter badal kar dobara try karein.' : 'Pehla product add karke apna catalog shuru karein.'}</p>
                {!search.trim() && !categoryFilter && (
                  <button className="primary-button" onClick={openCreateForm} type="button"><Icon name="plus" size={16} />Add product</button>
                )}
              </div>
            ) : (
              <>
                <div className="table-scroll">
                  <table className="category-table product-table">
                    <thead>
                      <tr>
                        <th scope="col">Product</th>
                        <th scope="col">Category</th>
                        <th scope="col">Price</th>
                        <th scope="col">Inventory</th>
                        <th scope="col">Status</th>
                        <th scope="col"><span className="visually-hidden">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleProducts.map((product, index) => {
                        const id = productId(product) ?? index
                        const name = readValue(product, 'productName', 'ProductName', 'Unnamed product')
                        const sku = readValue(product, 'sku', 'SKU', '—')
                        const primaryImage = readValue(product, 'primaryImage', 'PrimaryImage')
                        const categoryName = readValue(product, 'categoryName', 'CategoryName', '—')
                        const price = readValue(product, 'discountPrice', 'DiscountPrice') || readValue(product, 'price', 'Price')
                        const stock = Number(readValue(product, 'stockQuantity', 'StockQuantity', 0))
                        const isActive = Boolean(readValue(product, 'isActive', 'IsActive', true))
                        const isFeatured = Boolean(readValue(product, 'isFeatured', 'IsFeatured', false))
                        const isBusy = busyProductId === id

                        return (
                          <tr key={id}>
                            <td>
                              <div className="category-name-cell">
                                <span className="category-thumb product-thumb">{primaryImage ? <img alt="" loading="lazy" src={getProductImageUrl(primaryImage)} /> : <Icon name="box" size={17} />}</span>
                                <span>
                                  <span className="category-name">{name}{isFeatured && <span className="featured-label">Featured</span>}</span>
                                  <span className="category-id">SKU: {sku}</span>
                                </span>
                              </div>
                            </td>
                            <td>{categoryName}</td>
                            <td><span className="product-price">{formatPrice(price)}</span></td>
                            <td><span className={stock > 0 ? 'stock-label' : 'stock-label out'}>{stock > 0 ? `${stock} in stock` : 'Out of stock'}</span></td>
                            <td><span className={isActive ? 'status-badge active' : 'status-badge'}>{isActive ? 'Active' : 'Inactive'}</span></td>
                            <td>
                              <div className="row-actions listing-row-actions">
                                <button
                                  aria-label={`Add or manage images for ${name}`}
                                  className="icon-button"
                                  disabled={saving || isBusy}
                                  onClick={() => openImages(product)}
                                  title="Add or manage product images"
                                  type="button"
                                ><Icon name="image" size={16} /><span>Images</span></button>
                                <button
                                  aria-label={`Add or manage sizes and videos for ${name}`}
                                  className="icon-button listing-details-button"
                                  disabled={saving || isBusy}
                                  onClick={() => setListingDetailsProduct(product)}
                                  title="Manage sizes, prices, stock and video links"
                                  type="button"
                                ><Icon name="box" size={16} /><span>Sizes &amp; videos</span></button>
                                <button
                                  aria-label={`Edit ${name}`}
                                  className="icon-button"
                                  disabled={saving || isBusy}
                                  onClick={() => openEditForm(product)}
                                  title="Edit product"
                                  type="button"
                                ><Icon name="edit" size={16} /></button>
                                <button
                                  aria-label={`${isActive ? 'Deactivate' : 'Activate'} ${name}`}
                                  className="icon-button"
                                  disabled={saving || isBusy}
                                  onClick={() => changeStatus(product)}
                                  title={isActive ? 'Deactivate product' : 'Activate product'}
                                  type="button"
                                ><Icon name="sparkle" size={16} /></button>
                                <button
                                  aria-label={`Delete ${name}`}
                                  className="icon-button danger"
                                  disabled={saving || isBusy}
                                  onClick={() => removeProduct(product)}
                                  title="Delete product"
                                  type="button"
                                ><Icon name="trash" size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <footer className="table-footer">
                  <span>{visibleProducts.length} {visibleProducts.length === 1 ? 'product' : 'products'} shown</span>
                  <span>Manage product details and stock</span>
                </footer>
              </>
            )}
          </section>
        </div>
      </main>

      {(isAdding || editingProduct) && (
        <ProductFormModal
          categories={categories}
          error={formError}
          onClose={closeForm}
          onSubmit={saveProduct}
          product={editingProduct}
          saving={saving}
        />
      )}
      {imagesProduct && (
        <ProductImagesModal
          onClose={() => setImagesProduct(null)}
          product={imagesProduct}
          productId={productId(imagesProduct)}
        />
      )}
      {listingDetailsProduct && (
        <ProductListingDetailsModal
          onClose={() => setListingDetailsProduct(null)}
          product={listingDetailsProduct}
          productId={productId(listingDetailsProduct)}
        />
      )}
    </div>
  )
}

export default ProductsPage
