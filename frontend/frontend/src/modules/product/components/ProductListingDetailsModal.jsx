import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from '../../category/components/Icon.jsx'
import { createProductVideo, deleteProductVideo, getAdminProductVideos } from '../../productVideos/api/adminProductVideoApi.js'
import { createVariant, getAdminVariants, setVariantActive, updateVariant } from '../../productVariant/api/productVariantApi.js'

function value(item, camel, pascal, fallback = '') {
  return item?.[camel] ?? item?.[pascal] ?? fallback
}

function isEnabled(valueToCheck) {
  return valueToCheck === true || valueToCheck === 1 || valueToCheck === '1' || valueToCheck === 'true'
}

function ProductListingDetailsModal({ product, productId, onClose }) {
  const [tab, setTab] = useState('sizes')
  const [sizes, setSizes] = useState([])
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [editingSize, setEditingSize] = useState(null)
  const [sizeForm, setSizeForm] = useState({ SizeLabel: '', Price: '', DiscountPrice: '', StockQuantity: '0' })
  const [videoForm, setVideoForm] = useState({ StorageKey: '', IsIllustrativePreview: false })
  const savingRef = useRef(saving)

  useEffect(() => {
    savingRef.current = saving
  }, [saving])

  const loadDetails = useCallback(async () => {
    setLoading(true)
    setError('')
    const results = await Promise.allSettled([
      getAdminVariants({ productId: String(productId), isActive: '' }),
      getAdminProductVideos({ productId: String(productId), isIllustrativePreview: '' }),
    ])
    if (results[0].status === 'fulfilled') setSizes(results[0].value)
    else setError(results[0].reason?.message || 'Product sizes load nahi ho sake.')
    if (results[1].status === 'fulfilled') setVideos(results[1].value)
    else setError((current) => [current, results[1].reason?.message].filter(Boolean).join(' · '))
    setLoading(false)
  }, [productId])

  useEffect(() => {
    let active = true
    Promise.resolve().then(() => active && loadDetails())
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !savingRef.current) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      active = false
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [loadDetails, onClose])

  function startEditSize(size) {
    setEditingSize(size)
    setSizeForm({
      SizeLabel: value(size, 'sizeLabel', 'SizeLabel'),
      Price: String(value(size, 'price', 'Price')),
      DiscountPrice: value(size, 'discountPrice', 'DiscountPrice') == null ? '' : String(value(size, 'discountPrice', 'DiscountPrice')),
      StockQuantity: String(value(size, 'stockQuantity', 'StockQuantity', 0)),
    })
    setFormError('')
  }

  async function saveSize(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    const data = {
      ProductId: Number(productId),
      SizeLabel: sizeForm.SizeLabel.trim(),
      Price: Number(sizeForm.Price),
      DiscountPrice: sizeForm.DiscountPrice === '' ? null : Number(sizeForm.DiscountPrice),
      StockQuantity: Number(sizeForm.StockQuantity),
      ...(editingSize ? { IsActive: isEnabled(value(editingSize, 'isActive', 'IsActive', true)) } : {}),
    }
    try {
      if (editingSize) await updateVariant(value(editingSize, 'productVariantId', 'ProductVariantId'), data)
      else await createVariant(data)
      setEditingSize(null)
      setSizeForm({ SizeLabel: '', Price: '', DiscountPrice: '', StockQuantity: '0' })
      await loadDetails()
    } catch (saveError) {
      setFormError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleSize(size) {
    setSaving(true)
    setError('')
    try {
      await setVariantActive(
        value(size, 'productVariantId', 'ProductVariantId'),
        !isEnabled(value(size, 'isActive', 'IsActive', true)),
      )
      await loadDetails()
    } catch (actionError) {
      setError(actionError.message)
    } finally {
      setSaving(false)
    }
  }

  async function saveVideo(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const url = new URL(videoForm.StorageKey.trim())
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Valid HTTPS video URL dalein.')
      const extension = url.pathname.split('.').pop()?.toLowerCase()
      const fileTypes = { mp4: 'video/mp4', webm: 'video/webm', ogg: 'video/ogg' }
      if (!fileTypes[extension]) throw new Error('Direct video file URL use karein. MP4, WebM ya OGG supported hai; YouTube page link nahi.')
      const fileName = decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1) || url.hostname)
      await createProductVideo({
        ProductId: Number(productId),
        StorageKey: url.href,
        OriginalFileName: fileName.slice(0, 255),
        FileType: fileTypes[extension],
        FileSize: 1,
        IsIllustrativePreview: videoForm.IsIllustrativePreview,
      })
      setVideoForm({ StorageKey: '', IsIllustrativePreview: false })
      await loadDetails()
    } catch (saveError) {
      setFormError(saveError.message || 'Video link add nahi ho saka.')
    } finally {
      setSaving(false)
    }
  }

  async function removeVideo(video) {
    const name = value(video, 'originalFileName', 'OriginalFileName', 'this video')
    if (!window.confirm(`"${name}" video link delete karna chahte hain?`)) return
    setSaving(true)
    setError('')
    try {
      await deleteProductVideo(value(video, 'productVideoId', 'ProductVideoId'))
      await loadDetails()
    } catch (actionError) {
      setError(actionError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose()
    }}>
      <section aria-labelledby="listing-details-title" aria-modal="true" className="modal product-listing-details-modal" role="dialog">
        <header className="modal-header">
          <div>
            <h2 id="listing-details-title">Sizes &amp; videos</h2>
            <p>{value(product, 'productName', 'ProductName', 'Product')} · Set size-wise price and add a hosted video link.</p>
          </div>
          <button aria-label="Close dialog" className="icon-button modal-close" disabled={saving} onClick={onClose} type="button"><Icon name="close" /></button>
        </header>

        <div className="listing-detail-tabs" role="tablist" aria-label="Product listing details">
          <button aria-selected={tab === 'sizes'} className={tab === 'sizes' ? 'active' : ''} onClick={() => { setTab('sizes'); setFormError('') }} role="tab" type="button">Sizes &amp; pricing <span>{sizes.length}</span></button>
          <button aria-selected={tab === 'videos'} className={tab === 'videos' ? 'active' : ''} onClick={() => { setTab('videos'); setFormError('') }} role="tab" type="button">Videos <span>{videos.length}</span></button>
        </div>

        {error && <p className="module-alert listing-details-error" role="alert">{error}</p>}
        {tab === 'sizes' ? (
          <div className="listing-details-body">
            <form className="listing-detail-form" onSubmit={saveSize}>
              <h3>{editingSize ? 'Edit size' : 'Add a size'}</h3>
              <div className="listing-detail-form-grid">
                <label className="module-field">Size label<input className="module-input" maxLength="100" onChange={(event) => setSizeForm({ ...sizeForm, SizeLabel: event.target.value })} placeholder="e.g. 5 x 8 ft" required value={sizeForm.SizeLabel} /></label>
                <label className="module-field">Price (₹)<input className="module-input" min="0.01" onChange={(event) => setSizeForm({ ...sizeForm, Price: event.target.value })} required step="0.01" type="number" value={sizeForm.Price} /></label>
                <label className="module-field">Offer price (optional)<input className="module-input" min="0" onChange={(event) => setSizeForm({ ...sizeForm, DiscountPrice: event.target.value })} step="0.01" type="number" value={sizeForm.DiscountPrice} /></label>
                <label className="module-field">Stock quantity<input className="module-input" min="0" onChange={(event) => setSizeForm({ ...sizeForm, StockQuantity: event.target.value })} required type="number" value={sizeForm.StockQuantity} /></label>
              </div>
              {formError && <p className="module-alert" role="alert">{formError}</p>}
              <div className="listing-detail-form-actions">
                {editingSize && <button className="module-button" disabled={saving} onClick={() => { setEditingSize(null); setFormError(''); setSizeForm({ SizeLabel: '', Price: '', DiscountPrice: '', StockQuantity: '0' }) }} type="button">Cancel edit</button>}
                <button className="module-button primary" disabled={saving} type="submit">{saving ? 'Saving…' : editingSize ? 'Save size' : 'Add size'}</button>
              </div>
            </form>

            <section className="listing-detail-saved">
              <h3>Saved sizes</h3>
              {loading ? <div className="module-state">Loading sizes…</div> : sizes.length === 0 ? <div className="module-state">Abhi size options nahi hain. Upar se pehla size add karein.</div> : (
                <div className="listing-size-list">
                  {sizes.map((size) => {
                    const id = value(size, 'productVariantId', 'ProductVariantId')
                    const active = isEnabled(value(size, 'isActive', 'IsActive', true))
                    return (
                      <article className="listing-size-item" key={id}>
                        <div><strong>{value(size, 'sizeLabel', 'SizeLabel')}</strong><span>{value(size, 'stockQuantity', 'StockQuantity', 0)} in stock · {active ? 'Active' : 'Inactive'}</span></div>
                        <strong>₹{value(size, 'discountPrice', 'DiscountPrice') ?? value(size, 'price', 'Price')}</strong>
                        <div className="module-row-actions">
                          <button className="module-button" disabled={saving} onClick={() => startEditSize(size)} type="button">Edit</button>
                          <button className="module-button" disabled={saving} onClick={() => toggleSize(size)} type="button">{active ? 'Hide' : 'Show'}</button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="listing-details-body">
            <form className="listing-detail-form" onSubmit={saveVideo}>
              <h3>Add a product video</h3>
              <p className="listing-detail-help">Video file ko apne hosting par upload karke direct MP4, WebM ya OGG URL paste karein. YouTube page link player mein nahi chalega.</p>
              <label className="module-field">Direct video file URL<input autoComplete="url" className="module-input" maxLength="500" onChange={(event) => setVideoForm({ ...videoForm, StorageKey: event.target.value })} placeholder="https://example.com/rug-video.mp4" required type="url" value={videoForm.StorageKey} /></label>
              <label className="module-checkbox"><input checked={videoForm.IsIllustrativePreview} onChange={(event) => setVideoForm({ ...videoForm, IsIllustrativePreview: event.target.checked })} type="checkbox" />Illustrative preview</label>
              {formError && <p className="module-alert" role="alert">{formError}</p>}
              <div className="listing-detail-form-actions"><button className="module-button primary" disabled={saving} type="submit">{saving ? 'Adding…' : 'Add video link'}</button></div>
            </form>

            <section className="listing-detail-saved">
              <h3>Saved videos</h3>
              {loading ? <div className="module-state">Loading videos…</div> : videos.length === 0 ? <div className="module-state">Abhi video link nahi hai. Upar se hosted video link add karein.</div> : (
                <div className="listing-size-list">
                  {videos.map((video) => {
                    const id = value(video, 'productVideoId', 'ProductVideoId')
                    const url = value(video, 'storageKey', 'StorageKey')
                    return (
                      <article className="listing-video-item" key={id}>
                        <div><strong>{value(video, 'originalFileName', 'OriginalFileName', 'Product video')}</strong><a href={url} rel="noreferrer" target="_blank">{url}</a></div>
                        <button aria-label="Delete video link" className="icon-button danger" disabled={saving} onClick={() => removeVideo(video)} title="Delete video link" type="button"><Icon name="trash" size={16} /></button>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </div>
  )
}

export default ProductListingDetailsModal
