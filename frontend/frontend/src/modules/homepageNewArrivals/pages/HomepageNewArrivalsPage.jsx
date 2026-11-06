import { useEffect, useMemo, useState } from 'react'
import AdminModuleLayout from '../../shared/components/AdminModuleLayout.jsx'
import { getProductImageUrl, getProducts } from '../../product/api/productApi.js'
import { getHomepageNewArrivalProductIds, saveHomepageNewArrivalProductIds } from '../api/homepageNewArrivalsApi.js'
import '../../shared/components/AdminModulePage.css'
import './HomepageNewArrivalsPage.css'

function productId(product) {
  return product?.productId ?? product?.ProductId ?? product?.id ?? product?.Id
}

function productName(product) {
  return product?.productName ?? product?.ProductName ?? 'Unnamed product'
}

function productImage(product) {
  return product?.primaryImageUrl
    ?? product?.PrimaryImageUrl
    ?? product?.primaryImage
    ?? product?.PrimaryImage
    ?? product?.primaryImageStorageKey
    ?? product?.PrimaryImageStorageKey
    ?? product?.imageUrl
    ?? product?.ImageUrl
    ?? product?.imageStorageKey
    ?? product?.ImageStorageKey
    ?? product?.storageKey
    ?? product?.StorageKey
    ?? ''
}

function HomepageNewArrivalsPage({ user, onLogout, onNavigate }) {
  const [products, setProducts] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getProducts(), getHomepageNewArrivalProductIds()])
      .then(([loadedProducts, productIds]) => {
        if (!active) return
        setProducts(loadedProducts)
        const availableIds = new Set(loadedProducts.map((product) => String(productId(product))))
        setSelectedIds(productIds.map(String).filter((id) => availableIds.has(id)))
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  const selectedProducts = useMemo(() => {
    const productsById = new Map(products.map((product) => [String(productId(product)), product]))
    return selectedIds.map((id) => productsById.get(id)).filter(Boolean)
  }, [products, selectedIds])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products.filter((product) => {
      const name = productName(product).toLowerCase()
      const sku = String(product?.sku ?? product?.SKU ?? '').toLowerCase()
      return name.includes(query) || sku.includes(query)
    })
  }, [products, search])

  function toggleProduct(product) {
    const id = String(productId(product))
    setSelectedIds((current) => current.includes(id)
      ? current.filter((selectedId) => selectedId !== id)
      : [...current, id])
    setNotice('')
  }

  function moveProduct(index, direction) {
    setSelectedIds((current) => {
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= current.length) return current
      const next = [...current]
      const currentId = next[index]
      next[index] = next[nextIndex]
      next[nextIndex] = currentId
      return next
    })
    setNotice('')
  }

  async function saveSelection() {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await saveHomepageNewArrivalProductIds(selectedIds.map(Number))
      setNotice('New Arrivals section updated.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminModuleLayout activeModule="new-arrivals" title="New Arrivals" user={user} onLogout={onLogout} onNavigate={onNavigate}>
      <section className="page-content module-page">
        <div className="module-heading">
          <div>
            <p className="module-eyebrow">STOREFRONT CONTENT</p>
            <h1>New Arrivals</h1>
            <p>Select the catalog products to show on the homepage and arrange their display order.</p>
          </div>
          <button className="module-button primary" disabled={loading || saving} onClick={saveSelection} type="button">
            {saving ? 'Saving...' : 'Save selection'}
          </button>
        </div>

        {error && <p className="module-alert" role="alert">{error}</p>}
        {notice && <p className="new-arrivals-notice" role="status">{notice}</p>}

        <section className="module-panel">
          <div className="module-panel-heading">
            <h2>Selected products</h2>
            <span>{selectedProducts.length} selected</span>
          </div>
          {selectedProducts.length === 0
            ? <p className="new-arrivals-empty">No products selected. Select products below to show the section on the homepage.</p>
            : <ol className="new-arrivals-selected-list">
              {selectedProducts.map((product, index) => {
                const id = String(productId(product))
                const image = productImage(product)
                return (
                  <li className="new-arrivals-selected-item" key={id}>
                    {image
                      ? <img alt="" src={getProductImageUrl(image)} />
                      : <span aria-hidden="true" className="new-arrivals-placeholder">JC</span>}
                    <span className="new-arrivals-product-name">{productName(product)}</span>
                    <div className="new-arrivals-item-actions">
                      <button aria-label={`Move ${productName(product)} up`} className="module-button" disabled={index === 0} onClick={() => moveProduct(index, -1)} type="button">↑</button>
                      <button aria-label={`Move ${productName(product)} down`} className="module-button" disabled={index === selectedProducts.length - 1} onClick={() => moveProduct(index, 1)} type="button">↓</button>
                      <button aria-label={`Remove ${productName(product)}`} className="module-button danger" onClick={() => toggleProduct(product)} type="button">Remove</button>
                    </div>
                  </li>
                )
              })}
            </ol>}
        </section>

        <section className="module-panel">
          <div className="module-panel-heading new-arrivals-catalog-heading">
            <h2>Product catalog</h2>
            <input aria-label="Search products" className="module-input module-filter" onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." type="search" value={search} />
          </div>
          {loading
            ? <p className="new-arrivals-empty" role="status">Loading products...</p>
            : filteredProducts.length
              ? <div className="new-arrivals-catalog">
                {filteredProducts.map((product) => {
                  const id = String(productId(product))
                  const image = productImage(product)
                  const selected = selectedIds.includes(id)
                  const active = product?.isActive ?? product?.IsActive ?? true
                  return (
                    <label className={`new-arrivals-catalog-card${selected ? ' selected' : ''}`} key={id}>
                      <input checked={selected} onChange={() => toggleProduct(product)} type="checkbox" />
                      {image
                        ? <img alt="" loading="lazy" src={getProductImageUrl(image)} />
                        : <span aria-hidden="true" className="new-arrivals-placeholder">JC</span>}
                      <span className="new-arrivals-catalog-info">
                        <strong>{productName(product)}</strong>
                        <small>{product?.sku ?? product?.SKU ?? `Product #${id}`}{!active ? ' · Inactive' : ''}</small>
                      </span>
                    </label>
                  )
                })}
              </div>
              : <p className="new-arrivals-empty">{loading ? 'Loading products...' : 'No products match your search.'}</p>}
        </section>
      </section>
    </AdminModuleLayout>
  )
}

export default HomepageNewArrivalsPage
