import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../../category/components/Icon.jsx'
import { getProductImageUrl, getProductImages } from '../api/productApi.js'

function readImage(image, camelName, pascalName, fallback = '') {
  return image?.[camelName] ?? image?.[pascalName] ?? fallback
}

function ProductListingImage({ productId, primaryImage, productName }) {
  const [images, setImages] = useState([])
  const [imageIndex, setImageIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const hideTimer = useRef(null)
  const loaded = useRef(false)

  function updatePosition(target) {
    const rect = target.getBoundingClientRect()
    const width = Math.min(320, window.innerWidth - 24)
    const height = Math.min(290, window.innerHeight - 24)
    setPosition({
      top: Math.max(12, Math.min(rect.top + rect.height / 2 - height / 2, window.innerHeight - height - 12)),
      left: Math.max(12, Math.min(rect.right + 12, window.innerWidth - width - 12)),
    })
  }

  async function showGallery(event) {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    updatePosition(event.currentTarget)
    setIsOpen(true)
    if (loaded.current) return

    loaded.current = true
    setLoading(true)
    setError('')
    try {
      const gallery = await getProductImages(productId)
      setImages(gallery)
      const primaryIndex = gallery.findIndex((image) => (
        Boolean(readImage(image, 'isPrimary', 'IsPrimary', false))
        || readImage(image, 'storageKey', 'StorageKey') === primaryImage
      ))
      setImageIndex(Math.max(0, primaryIndex))
    } catch (loadError) {
      loaded.current = false
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  function scheduleClose() {
    hideTimer.current = setTimeout(() => setIsOpen(false), 140)
  }

  function keepOpen() {
    if (hideTimer.current) clearTimeout(hideTimer.current)
  }

  const currentImage = images[imageIndex]
  const imageKey = currentImage
    ? readImage(currentImage, 'storageKey', 'StorageKey')
    : primaryImage
  const imageCount = images.length || Number(Boolean(primaryImage))

  return (
    <>
      <button
        aria-label={`Preview ${productName} images`}
        className="category-thumb product-thumb product-image-hover-trigger"
        onFocus={showGallery}
        onMouseEnter={showGallery}
        onMouseLeave={scheduleClose}
        onTouchStart={showGallery}
        type="button"
      >
        {primaryImage ? <img alt="" loading="lazy" src={getProductImageUrl(primaryImage)} /> : <Icon name="box" size={17} />}
      </button>
      {isOpen && createPortal(
        <div
          aria-label={`${productName} image gallery`}
          className="product-image-hover-card"
          onMouseEnter={keepOpen}
          onMouseLeave={scheduleClose}
          role="group"
          style={{ top: position.top, left: position.left }}
        >
          <div className="product-image-hover-preview">
            {loading ? (
              <span className="product-image-hover-message" role="status">Gallery load ho rahi hai...</span>
            ) : error ? (
              <span className="product-image-hover-message" role="alert">{error}</span>
            ) : imageKey ? (
              <img alt={`${productName} · image ${imageIndex + 1}`} src={getProductImageUrl(imageKey)} />
            ) : (
              <span className="product-image-hover-message">Is product ki image nahi hai.</span>
            )}
            {imageCount > 1 && !loading && !error && (
              <>
                <button
                  aria-label="Previous product image"
                  className="product-image-hover-arrow previous"
                  onClick={() => setImageIndex((index) => (index - 1 + images.length) % images.length)}
                  type="button"
                >‹</button>
                <button
                  aria-label="Next product image"
                  className="product-image-hover-arrow next"
                  onClick={() => setImageIndex((index) => (index + 1) % images.length)}
                  type="button"
                >›</button>
              </>
            )}
          </div>
          <div className="product-image-hover-caption">
            <strong>{productName}</strong>
            <span>{images.length ? `${imageIndex + 1} / ${images.length}` : 'Image preview'}</span>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

export default ProductListingImage
