import { useCallback, useEffect, useMemo, useState } from 'react'
import { getProductImageUrl, getProducts } from '../../product/api/productApi.js'
import AdminModuleLayout from '../../shared/components/AdminModuleLayout.jsx'
import ImageUploadField from '../../shared/components/ImageUploadField.jsx'
import { deleteContentImage, getContentImageMap, uploadContentImage } from '../../shared/api/contentImageApi.js'
import '../shared/AdminModulePage.css'
import { createVariant, getAdminVariants, setVariantActive, updateVariant } from '../api/productVariantApi.js'

function value(item, camel, pascal, fallback = '') {
  return item?.[camel] ?? item?.[pascal] ?? fallback
}

function isEnabled(valueToCheck) {
  return valueToCheck === true || valueToCheck === 1 || valueToCheck === '1' || valueToCheck === 'true'
}

const emptyForm = { ProductId: '', SizeLabel: '', Price: '', DiscountPrice: '', StockQuantity: '0', IsActive: true }

function ProductVariantsPage({ user, onLogout, onNavigate }) {
  const [variants, setVariants] = useState([])
  const [products, setProducts] = useState([])
  const [productFilter, setProductFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [imageMap, setImageMap] = useState({})
  const [imageFile, setImageFile] = useState(null)
  const [imageKey, setImageKey] = useState('')
  const [imageRemoved, setImageRemoved] = useState(false)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const loadVariants = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [items, images] = await Promise.all([
        getAdminVariants({ productId: productFilter, isActive: activeFilter }),
        getContentImageMap('variants'),
      ])
      setImageMap(images)
      setVariants(items.map((item) => ({
        ...item,
        imageStorageKey: images[String(value(item, 'productVariantId', 'ProductVariantId'))] || '',
      })))
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [productFilter, activeFilter])

  useEffect(() => {
    let active = true
    Promise.resolve().then(() => active && loadVariants())
    return () => { active = false }
  }, [loadVariants])
  useEffect(() => {
    let active = true
    getProducts().then((items) => {
      if (active) setProducts(items)
    }).catch((loadError) => {
      if (active) setError(`Products load nahi ho sake: ${loadError.message}`)
    })
    return () => { active = false }
  }, [])

  const productNames = useMemo(() => new Map(products.map((product) => [
    String(value(product, 'productId', 'ProductId')),
    value(product, 'productName', 'ProductName', 'Product'),
  ])), [products])

  function startCreate() {
    setEditing(null)
    setForm({ ...emptyForm, ProductId: productFilter || String(value(products[0], 'productId', 'ProductId', '')) })
    setImageFile(null)
    setImageKey('')
    setImageRemoved(false)
    setFormError('')
    setShowForm(true)
  }

  function startEdit(variant) {
    setEditing(variant)
    setImageFile(null)
    setImageKey(imageMap[String(value(variant, 'productVariantId', 'ProductVariantId'))] || '')
    setImageRemoved(false)
    setForm({
      ProductId: String(value(variant, 'productId', 'ProductId')),
      SizeLabel: value(variant, 'sizeLabel', 'SizeLabel'),
      Price: String(value(variant, 'price', 'Price')),
      DiscountPrice: value(variant, 'discountPrice', 'DiscountPrice') == null ? '' : String(value(variant, 'discountPrice', 'DiscountPrice')),
      StockQuantity: String(value(variant, 'stockQuantity', 'StockQuantity', 0)),
      IsActive: isEnabled(value(variant, 'isActive', 'IsActive', true)),
    })
    setFormError('')
    setShowForm(true)
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    const data = {
      ...form,
      ProductId: Number(form.ProductId),
      Price: Number(form.Price),
      DiscountPrice: form.DiscountPrice === '' ? null : Number(form.DiscountPrice),
      StockQuantity: Number(form.StockQuantity),
    }
    let savedVariant
    try {
      savedVariant = editing
        ? await updateVariant(value(editing, 'productVariantId', 'ProductVariantId'), data)
        : await createVariant(data)
    } catch (saveError) {
      setFormError(saveError.message)
      setSaving(false)
      return
    }

    const variantId = editing
      ? value(editing, 'productVariantId', 'ProductVariantId')
      : value(savedVariant?.data, 'productVariantId', 'ProductVariantId')
    try {
      if (imageFile) await uploadContentImage('variants', variantId, imageFile)
      else if (imageRemoved && variantId) await deleteContentImage('variants', variantId)
      setShowForm(false)
      await loadVariants()
    } catch (imageError) {
      if (!editing && variantId) {
        setEditing(savedVariant?.data || { ProductVariantId: variantId })
      }
      setFormError(`Variant save ho gaya, lekin image save nahi hui: ${imageError.message}`)
      await loadVariants()
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(variant) {
    const id = value(variant, 'productVariantId', 'ProductVariantId')
    try {
      await setVariantActive(id, !isEnabled(value(variant, 'isActive', 'IsActive', true)))
      await loadVariants()
    } catch (actionError) {
      setError(actionError.message)
    }
  }

  return (
    <AdminModuleLayout activeModule="variants" title="Product variants" user={user} onLogout={onLogout} onNavigate={onNavigate}>
      <section className="page-content module-page">
        <div className="module-heading"><div><p className="module-eyebrow">CATALOG</p><h1>Product variants</h1><p>Manage sizes, prices, and stock associated with products.</p></div><button className="module-button primary" onClick={startCreate} type="button">Add variant</button></div>
        <div className="module-toolbar">
          <div className="module-toolbar-group">
            <select aria-label="Filter by product" className="module-select module-filter" onChange={(event) => setProductFilter(event.target.value)} value={productFilter}>
              <option value="">All products</option>
              {products.map((product) => <option key={value(product, 'productId', 'ProductId')} value={value(product, 'productId', 'ProductId')}>{value(product, 'productName', 'ProductName')}</option>)}
            </select>
            <select aria-label="Filter by status" className="module-select module-filter" onChange={(event) => setActiveFilter(event.target.value)} value={activeFilter}>
              <option value="">All statuses</option><option value="1">Active</option><option value="0">Inactive</option>
            </select>
          </div>
          <span className="module-panel-heading">{variants.length} variants</span>
        </div>
        {showForm && <section className="module-form-panel">
          <h2>{editing ? 'Edit variant' : 'Add a variant'}</h2>
          {formError && <p className="module-alert" role="alert">{formError}</p>}
          <form className="module-form" onSubmit={submit}>
            <div className="module-field wide"><span>Variant image (optional)</span><ImageUploadField file={imageFile} hint="JPEG, PNG, WebP ya GIF · Maximum 15 MB" id="variantImage" label="Variant image" onClear={() => { setImageFile(null); setImageKey(''); setImageRemoved(true) }} onFileChange={(file) => { setImageFile(file); setImageRemoved(false) }} value={imageKey} /></div>
            <label className="module-field">Product<select className="module-select" onChange={(event) => setForm({ ...form, ProductId: event.target.value })} required value={form.ProductId}><option value="">Select product</option>{products.map((product) => <option key={value(product, 'productId', 'ProductId')} value={value(product, 'productId', 'ProductId')}>{value(product, 'productName', 'ProductName')}</option>)}</select></label>
            <label className="module-field">Size / label<input className="module-input" maxLength="100" onChange={(event) => setForm({ ...form, SizeLabel: event.target.value })} required value={form.SizeLabel} /></label>
            <label className="module-field">Price<input className="module-input" min="0.01" onChange={(event) => setForm({ ...form, Price: event.target.value })} required step="0.01" type="number" value={form.Price} /></label>
            <label className="module-field">Discount price (optional)<input className="module-input" min="0" onChange={(event) => setForm({ ...form, DiscountPrice: event.target.value })} step="0.01" type="number" value={form.DiscountPrice} /></label>
            <label className="module-field">Stock quantity<input className="module-input" min="0" onChange={(event) => setForm({ ...form, StockQuantity: event.target.value })} required type="number" value={form.StockQuantity} /></label>
            {editing && <label className="module-checkbox"><input checked={form.IsActive} onChange={(event) => setForm({ ...form, IsActive: event.target.checked })} type="checkbox" />Active</label>}
            <div className="module-form-actions"><button className="module-button" disabled={saving} onClick={() => setShowForm(false)} type="button">Cancel</button><button className="module-button primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save variant'}</button></div>
          </form>
        </section>}
        <section className="module-panel">
          <div className="module-panel-heading"><h2>All variants</h2><span>Product-specific pricing and stock</span></div>
          {error && <div className="module-state error" role="alert">{error}</div>}
          {loading ? <div className="module-state">Loading variants…</div> : variants.length === 0 ? <div className="module-state">No product variants found for these filters.</div> : (
            <div className="module-table-wrap"><table className="module-table"><thead><tr><th>Product / size</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>
              {variants.map((variant) => {
                const id = value(variant, 'productVariantId', 'ProductVariantId')
                const active = isEnabled(value(variant, 'isActive', 'IsActive', true))
                return <tr key={id}><td>{value(variant, 'imageStorageKey', 'ImageStorageKey') && <img alt="" className="module-image-thumbnail" src={getProductImageUrl(value(variant, 'imageStorageKey', 'ImageStorageKey'))} />}<strong>{productNames.get(String(value(variant, 'productId', 'ProductId'))) || value(variant, 'productName', 'ProductName', 'Product')}</strong><span className="muted">{value(variant, 'sizeLabel', 'SizeLabel')}</span></td><td><strong>₹{value(variant, 'discountPrice', 'DiscountPrice') ?? value(variant, 'price', 'Price')}</strong><span className="muted">{value(variant, 'discountPrice', 'DiscountPrice') != null ? `List ₹${value(variant, 'price', 'Price')}` : ''}</span></td><td>{value(variant, 'stockQuantity', 'StockQuantity', 0)}</td><td>{active ? 'Active' : 'Inactive'}</td><td><div className="module-row-actions"><button className="module-button" onClick={() => startEdit(variant)} type="button">Edit</button><button className="module-button" onClick={() => toggleActive(variant)} type="button">{active ? 'Deactivate' : 'Activate'}</button></div></td></tr>
              })}
            </tbody></table></div>
          )}
        </section>
      </section>
    </AdminModuleLayout>
  )
}

export default ProductVariantsPage
