import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from '../../category/components/Icon.jsx'
import {
  addProductImage,
  deleteProductImage,
  getProductImageUrl,
  getProductImages,
  setPrimaryProductImage,
  updateProductImageOrder,
} from '../api/productApi.js'

function readImage(image, camelName, pascalName, fallback = '') {
  return image?.[camelName] ?? image?.[pascalName] ?? fallback
}

function imageId(image) {
  return readImage(image, 'productImageId', 'ProductImageId', image?.id ?? image?.Id)
}

function ProductImagesModal({ product, productId, onClose }) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyImageId, setBusyImageId] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [localPreview, setLocalPreview] = useState('')
  const fileInputRef = useRef(null)
  const previewUrlRef = useRef('')
  const [values, setValues] = useState({
    IsPrimary: false,
    DisplayOrder: 0,
  })
  const savingRef = useRef(saving)

  useEffect(() => {
    savingRef.current = saving
  }, [saving])

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
  }, [])

  const loadImages = useCallback(async () => {
    setLoading(true)
    setListError('')

    try {
      const items = await getProductImages(productId)
      setImages(items)
      setValues((current) => ({ ...current, DisplayOrder: items.length }))
    } catch (error) {
      setListError(error.message)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    let active = true

    getProductImages(productId)
      .then((items) => {
        if (active) {
          setImages(items)
          setValues((current) => ({ ...current, DisplayOrder: items.length }))
        }
      })
      .catch((error) => {
        if (active) setListError(error.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !savingRef.current) onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      active = false
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, productId])

  function updateField(event) {
    const { name, value, checked, type } = event.target
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  function chooseFile(event) {
    const file = event.target.files?.[0] || null
    setSelectedFile(file)
    setFormError('')
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = file ? URL.createObjectURL(file) : ''
    setLocalPreview(previewUrlRef.current)

    if (file && file.size > 5 * 1024 * 1024) {
      setFormError('Image size 5 MB ya usse kam honi chahiye.')
    } else if (file && !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setFormError('Sirf JPEG, PNG, WebP ya GIF image select karein.')
    } else if (file && images.length >= 8) {
      setFormError('Ek product par maximum 8 images add kar sakte hain.')
    }
  }

  async function submitImage(event) {
    event.preventDefault()
    if (!selectedFile) {
      setFormError('Apne computer se image select karein.')
      return
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFormError('Image size 5 MB ya usse kam honi chahiye.')
      return
    }
    if (images.length >= 8) {
      setFormError('Ek product par maximum 8 images add kar sakte hain.')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(selectedFile.type)) {
      setFormError('Sirf JPEG, PNG, WebP ya GIF image select karein.')
      return
    }

    setSaving(true)
    setFormError('')

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('IsPrimary', String(values.IsPrimary))
      formData.append('DisplayOrder', String(values.DisplayOrder))
      await addProductImage(productId, formData)
      setSelectedFile(null)
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = ''
      setLocalPreview('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setValues({
        IsPrimary: false,
        DisplayOrder: images.length,
      })
      await loadImages()
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function runImageAction(image, action) {
    const id = imageId(image)
    if (id === undefined || id === null) {
      setActionError('Image ID nahi mila, isliye action complete nahi hua.')
      return
    }

    setActionError('')
    setBusyImageId(id)
    try {
      await action(id)
      await loadImages()
    } catch (error) {
      setActionError(error.message)
    } finally {
      setBusyImageId(null)
    }
  }

  function removeImage(image) {
    const id = imageId(image)
    const name = readImage(image, 'originalFileName', 'OriginalFileName', 'this image')
    if (id === undefined || id === null) {
      setActionError('Image ID nahi mila, isliye ise delete nahi kiya ja sakta.')
      return
    }
    if (!window.confirm(`"${name}" ko delete karna chahte hain?`)) return
    runImageAction(image, (imageKey) => deleteProductImage(productId, imageKey))
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving && busyImageId === null) onClose()
      }}
    >
      <section
        aria-labelledby="product-images-title"
        aria-modal="true"
        className="modal product-images-modal"
        role="dialog"
      >
        <header className="modal-header">
          <div>
            <h2 id="product-images-title">Product images</h2>
            <p>{product?.ProductName ?? product?.productName ?? 'Product'} · Add and organize its images</p>
          </div>
          <button
            aria-label="Close dialog"
            className="icon-button modal-close"
            disabled={saving || busyImageId !== null}
            onClick={onClose}
            type="button"
          >
            <Icon name="close" />
          </button>
        </header>

        <div className="product-images-content">
          <form className="product-image-form" onSubmit={submitImage}>
            <div className="product-images-section-heading">
              <div>
                <h3>Add image</h3>
                <p>{images.length} / 8 images · Maximum 8 photos for each product.</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field full">
                <label htmlFor="productImageFile">Image file <span>*</span></label>
                <input
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  id="productImageFile"
                  name="image"
                  onChange={chooseFile}
                  ref={fileInputRef}
                  disabled={images.length >= 8}
                  required
                  type="file"
                />
                <span className="form-hint">JPEG, PNG, WebP ya GIF · Maximum file size 5 MB</span>
              </div>
              <div className="form-field full">
                {localPreview && (
                  <div className="product-image-upload-preview">
                    <img alt="Selected image preview" src={localPreview} />
                    <span>
                      <strong>{selectedFile.name}</strong>
                      <small>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</small>
                    </span>
                  </div>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="DisplayOrder">Display order</label>
                <input id="DisplayOrder" min="0" name="DisplayOrder" onChange={updateField} type="number" value={values.DisplayOrder} />
              </div>
            </div>

            <div className="product-image-form-bottom">
              <label className="product-check">
                <input checked={values.IsPrimary} name="IsPrimary" onChange={updateField} type="checkbox" />
                Set as primary image
              </label>
              {formError && <p className="product-image-error" role="alert">{formError}</p>}
              <button className="primary-button" disabled={saving || images.length >= 8} type="submit">
                <Icon name="plus" size={16} />
                {saving ? 'Adding...' : 'Add image'}
              </button>
            </div>
          </form>

          <section aria-label="Saved product images" className="product-image-list">
            <div className="product-images-section-heading">
              <div>
                <h3>Saved images</h3>
                <p>{images.length} {images.length === 1 ? 'image' : 'images'} linked to this product</p>
              </div>
              <button className="secondary-button" disabled={loading} onClick={loadImages} type="button">Refresh</button>
            </div>

            {actionError && <div className="page-error product-image-action-error" role="alert"><Icon name="warning" size={16} />{actionError}</div>}
            {loading ? (
              <div aria-live="polite" className="loading-state"><span className="spinner" /><span>Images load ho rahi hain...</span></div>
            ) : listError ? (
              <div className="empty-state" role="alert">
                <Icon name="warning" size={21} />
                <h3>Images load nahi hui</h3>
                <p>{listError}</p>
                <button className="secondary-button" onClick={loadImages} type="button">Retry</button>
              </div>
            ) : images.length === 0 ? (
              <div className="empty-state product-image-empty">
                <span className="overview-icon"><Icon name="image" size={21} /></span>
                <h3>Abhi images nahi hain</h3>
                <p>Apne computer se product photos upload karke gallery shuru karein.</p>
              </div>
            ) : (
              <div className="product-image-grid">
                {images.map((image, index) => {
                  const id = imageId(image) ?? index
                  const storageKey = readImage(image, 'storageKey', 'StorageKey')
                  const fileName = readImage(image, 'originalFileName', 'OriginalFileName', storageKey || 'Product image')
                  const isPrimary = Boolean(readImage(image, 'isPrimary', 'IsPrimary', false))
                  const displayOrder = readImage(image, 'displayOrder', 'DisplayOrder', 0)
                  const imagePreview = getProductImageUrl(storageKey)
                  const isBusy = busyImageId === id

                  return (
                    <article className="product-image-card" key={id}>
                      <div className="product-image-preview">
                        {imagePreview
                          ? <img alt={fileName} loading="lazy" src={imagePreview} />
                          : <><Icon name="image" size={28} /><span>Stored image</span></>}
                        {isPrimary && <span className="product-image-primary">Primary</span>}
                      </div>
                      <div className="product-image-card-info">
                        <strong title={fileName}>{fileName}</strong>
                        <span title={storageKey}>{storageKey}</span>
                      </div>
                      <div className="product-image-card-actions">
                        <label className="image-order-control">
                          <span>Order</span>
                          <input
                            aria-label={`Display order for ${fileName}`}
                            defaultValue={displayOrder}
                            disabled={isBusy}
                            min="0"
                            onBlur={(event) => {
                              const nextOrder = Number(event.target.value)
                              if (Number.isInteger(nextOrder) && nextOrder >= 0 && nextOrder !== Number(displayOrder)) {
                                runImageAction(image, (imageKey) => updateProductImageOrder(productId, imageKey, nextOrder))
                              }
                            }}
                            type="number"
                          />
                        </label>
                        {!isPrimary && (
                          <button
                            className="secondary-button image-action-button"
                            disabled={isBusy}
                            onClick={() => runImageAction(image, (imageKey) => setPrimaryProductImage(productId, imageKey))}
                            type="button"
                          >Set primary</button>
                        )}
                        <button
                          aria-label={`Delete ${fileName}`}
                          className="icon-button danger"
                          disabled={isBusy}
                          onClick={() => removeImage(image)}
                          title="Delete image"
                          type="button"
                        ><Icon name="trash" size={16} /></button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  )
}

export default ProductImagesModal
