import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from '../../category/components/Icon.jsx'
import { getProductImageUrl } from '../api/productApi.js'
import { createProductVideo, deleteProductVideo, getAdminProductVideos } from '../../productVideos/api/adminProductVideoApi.js'
import { createVariant, getAdminVariants, setVariantActive, updateVariant } from '../../productVariant/api/productVariantApi.js'
import ImageUploadField from '../../shared/components/ImageUploadField.jsx'
import { deleteContentImage, getContentImageMap, uploadContentImage } from '../../shared/api/contentImageApi.js'

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
  const [sizeForm, setSizeForm] = useState({ SizeLabel: '', Price: '', DiscountPrice: '', UsdPrice: '', UsdDiscountPrice: '', StockQuantity: '0' })
  const [sizeImageMap, setSizeImageMap] = useState({})
  const [sizeImageFile, setSizeImageFile] = useState(null)
  const [sizeImageKey, setSizeImageKey] = useState('')
  const [sizeImageRemoved, setSizeImageRemoved] = useState(false)
  const [videoForm, setVideoForm] = useState({ File: null, IsIllustrativePreview: false })
  const [videoPreview, setVideoPreview] = useState('')
  const videoInputRef = useRef(null)
  const videoPreviewUrl = useRef('')
  const savingRef = useRef(saving)

  useEffect(() => {
    savingRef.current = saving
  }, [saving])

  useEffect(() => () => {
    if (videoPreviewUrl.current) URL.revokeObjectURL(videoPreviewUrl.current)
  }, [])

  function chooseVideo(event) {
    const file = event.target.files?.[0] || null
    if (videoPreviewUrl.current) URL.revokeObjectURL(videoPreviewUrl.current)
    videoPreviewUrl.current = file ? URL.createObjectURL(file) : ''
    setVideoForm({ ...videoForm, File: file })
    setVideoPreview(videoPreviewUrl.current)
  }

  const loadDetails = useCallback(async () => {
    setLoading(true)
    setError('')
    const results = await Promise.allSettled([
      getAdminVariants({ productId: String(productId), isActive: '' }),
      getAdminProductVideos({ productId: String(productId), isIllustrativePreview: '' }),
      getContentImageMap('variants'),
    ])
    if (results[2].status === 'fulfilled') {
      const images = results[2].value
      setSizeImageMap(images)
      if (results[0].status === 'fulfilled') {
        setSizes(results[0].value.map((size) => ({
          ...size,
          imageStorageKey: images[String(value(size, 'productVariantId', 'ProductVariantId'))] || '',
        })))
      }
    } else {
      setError((current) => [current, results[2].reason?.message].filter(Boolean).join(' · '))
      if (results[0].status === 'fulfilled') setSizes(results[0].value)
    }
    if (results[0].status === 'rejected') {
      setError((current) => [current, results[0].reason?.message || 'Product sizes load nahi ho sake.'].filter(Boolean).join(' · '))
    }
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
    setSizeImageFile(null)
    setSizeImageKey(sizeImageMap[String(value(size, 'productVariantId', 'ProductVariantId'))] || '')
    setSizeImageRemoved(false)
    setSizeForm({
      SizeLabel: value(size, 'sizeLabel', 'SizeLabel'),
      Price: String(value(size, 'price', 'Price')),
      DiscountPrice: value(size, 'discountPrice', 'DiscountPrice') == null ? '' : String(value(size, 'discountPrice', 'DiscountPrice')),
      UsdPrice: value(size, 'usdPrice', 'UsdPrice') == null ? '' : String(value(size, 'usdPrice', 'UsdPrice')),
      UsdDiscountPrice: value(size, 'usdDiscountPrice', 'UsdDiscountPrice') == null ? '' : String(value(size, 'usdDiscountPrice', 'UsdDiscountPrice')),
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
      UsdPrice: Number(sizeForm.UsdPrice),
      UsdDiscountPrice: sizeForm.UsdDiscountPrice === '' ? null : Number(sizeForm.UsdDiscountPrice),
      StockQuantity: Number(sizeForm.StockQuantity),
      ...(editingSize ? { IsActive: isEnabled(value(editingSize, 'isActive', 'IsActive', true)) } : {}),
    }
    let savedVariant
    try {
      savedVariant = editingSize
        ? await updateVariant(value(editingSize, 'productVariantId', 'ProductVariantId'), data)
        : await createVariant(data)
    } catch (saveError) {
      setFormError(saveError.message)
      setSaving(false)
      return
    }

    const variantId = editingSize
      ? value(editingSize, 'productVariantId', 'ProductVariantId')
      : value(savedVariant?.data, 'productVariantId', 'ProductVariantId')
    try {
      if (sizeImageFile) await uploadContentImage('variants', variantId, sizeImageFile)
      else if (sizeImageRemoved && variantId) await deleteContentImage('variants', variantId)
      setEditingSize(null)
      setSizeForm({ SizeLabel: '', Price: '', DiscountPrice: '', UsdPrice: '', UsdDiscountPrice: '', StockQuantity: '0' })
      await loadDetails()
      setSizeImageFile(null)
      setSizeImageKey('')
      setSizeImageRemoved(false)
    } catch (imageError) {
      if (!editingSize && variantId) {
        setEditingSize(savedVariant?.data || { ProductVariantId: variantId })
      }
      setFormError(`Size save ho gaya, lekin image save nahi hui: ${imageError.message}`)
      await loadDetails()
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
    if (!videoForm.File) {
      setFormError('Apni gallery se video select karein.')
      return
    }
    if (videoForm.File.size > 100 * 1024 * 1024) {
      setFormError('Video size 100 MB ya usse kam honi chahiye.')
      return
    }
    if (!['video/mp4', 'video/webm', 'video/ogg'].includes(videoForm.File.type)) {
      setFormError('Sirf MP4, WebM ya OGG video select karein.')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const formData = new FormData()
      formData.append('ProductId', String(productId))
      formData.append('IsIllustrativePreview', String(videoForm.IsIllustrativePreview))
      formData.append('video', videoForm.File)
      await createProductVideo(formData)
      setVideoForm({ File: null, IsIllustrativePreview: false })
      if (videoPreviewUrl.current) URL.revokeObjectURL(videoPreviewUrl.current)
      videoPreviewUrl.current = ''
      setVideoPreview('')
      if (videoInputRef.current) videoInputRef.current.value = ''
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
            <p>{value(product, 'productName', 'ProductName', 'Product')} · Set size-wise pricing and upload product videos.</p>
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
              <div className="module-field"><span>Size image (optional)</span><ImageUploadField file={sizeImageFile} hint="JPEG, PNG, WebP ya GIF · Maximum 15 MB" id="variantSizeImage" label="Size image" onClear={() => { setSizeImageFile(null); setSizeImageKey(''); setSizeImageRemoved(true) }} onFileChange={(file) => { setSizeImageFile(file); setSizeImageRemoved(false) }} value={sizeImageKey} /></div>
              <div className="listing-detail-form-grid">
                <label className="module-field">Size label<input className="module-input" maxLength="100" onChange={(event) => setSizeForm({ ...sizeForm, SizeLabel: event.target.value })} placeholder="e.g. 5 x 8 ft" required value={sizeForm.SizeLabel} /></label>
                <label className="module-field">India price (INR)<input className="module-input" min="0.01" onChange={(event) => setSizeForm({ ...sizeForm, Price: event.target.value })} required step="0.01" type="number" value={sizeForm.Price} /></label>
                <label className="module-field">International price (USD)<input className="module-input" min="0.01" onChange={(event) => setSizeForm({ ...sizeForm, UsdPrice: event.target.value })} required step="0.01" type="number" value={sizeForm.UsdPrice} /></label>
                <label className="module-field">Offer price (INR, optional)<input className="module-input" min="0" onChange={(event) => setSizeForm({ ...sizeForm, DiscountPrice: event.target.value })} step="0.01" type="number" value={sizeForm.DiscountPrice} /></label>
                <label className="module-field">Offer price (USD, optional)<input className="module-input" min="0" onChange={(event) => setSizeForm({ ...sizeForm, UsdDiscountPrice: event.target.value })} step="0.01" type="number" value={sizeForm.UsdDiscountPrice} /></label>
                <label className="module-field">Stock quantity<input className="module-input" min="0" onChange={(event) => setSizeForm({ ...sizeForm, StockQuantity: event.target.value })} required type="number" value={sizeForm.StockQuantity} /></label>
              </div>
              {formError && <p className="module-alert" role="alert">{formError}</p>}
              <div className="listing-detail-form-actions">
                {editingSize && <button className="module-button" disabled={saving} onClick={() => { setEditingSize(null); setSizeImageFile(null); setSizeImageKey(''); setSizeImageRemoved(false); setFormError(''); setSizeForm({ SizeLabel: '', Price: '', DiscountPrice: '', UsdPrice: '', UsdDiscountPrice: '', StockQuantity: '0' }) }} type="button">Cancel edit</button>}
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
                    const inrDiscount = Number(value(size, 'discountPrice', 'DiscountPrice', 0))
                    const usdDiscount = Number(value(size, 'usdDiscountPrice', 'UsdDiscountPrice', 0))
                    return (
                      <article className="listing-size-item" key={id}>
                        <div>{value(size, 'imageStorageKey', 'ImageStorageKey') && <img alt="" className="module-image-thumbnail" src={getProductImageUrl(value(size, 'imageStorageKey', 'ImageStorageKey'))} />}<strong>{value(size, 'sizeLabel', 'SizeLabel')}</strong><span>{value(size, 'stockQuantity', 'StockQuantity', 0)} in stock · {active ? 'Active' : 'Inactive'}</span></div>
                        <strong>₹{inrDiscount > 0 ? inrDiscount : value(size, 'price', 'Price')}</strong>
                        <span className="muted">{usdDiscount > 0 ? `$${usdDiscount}` : value(size, 'usdPrice', 'UsdPrice', null) == null ? 'USD not set' : `$${value(size, 'usdPrice', 'UsdPrice')}`}</span>
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
              <p className="listing-detail-help">Apne device ki gallery se MP4, WebM ya OGG video upload karein. Maximum 100 MB.</p>
              <label className="module-field">Video file<input accept="video/mp4,video/webm,video/ogg" className="module-input" onChange={chooseVideo} ref={videoInputRef} required type="file" /></label>
              {videoPreview && <video className="product-video-upload-preview" controls preload="metadata" src={videoPreview} />}
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
                    return (
                      <article className="listing-video-item" key={id}>
                        <div><strong>{value(video, 'originalFileName', 'OriginalFileName', 'Product video')}</strong><span>Uploaded video</span></div>
                        <video aria-label={value(video, 'originalFileName', 'OriginalFileName', 'Product video')} controls preload="metadata" src={getProductImageUrl(value(video, 'storageKey', 'StorageKey'))} />
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
