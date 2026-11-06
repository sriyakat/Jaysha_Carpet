import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../../category/components/Icon.jsx'
import { getProductImageUrl, getProductImages } from '../../product/api/productApi.js'

function readImageKey(image) {
  return image?.storageKey
    ?? image?.StorageKey
    ?? image?.primaryImageUrl
    ?? image?.PrimaryImageUrl
    ?? image?.imageStorageKey
    ?? image?.ImageStorageKey
    ?? ''
}

function ShopProductGallery({ productId, primaryImage, productName, tone }) {
  const [images, setImages] = useState([])
  const [imageIndex, setImageIndex] = useState(0)
  const [galleryError, setGalleryError] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [autoFit, setAutoFit] = useState(true)
  const [roomView, setRoomView] = useState(false)
  const loaded = useRef(false)

  async function loadGallery() {
    if (loaded.current || !productId) return

    loaded.current = true
    try {
      const gallery = await getProductImages(productId)
      const slides = gallery
        .map((image) => ({
          key: readImageKey(image),
          isPrimary: Boolean(image?.isPrimary ?? image?.IsPrimary),
        }))
        .filter((image) => image.key)
        .slice(0, 8)

      if (primaryImage && !slides.some((image) => image.key === primaryImage)) {
        slides.unshift({ key: primaryImage, isPrimary: true })
      }

      setImages(slides)
      const primaryIndex = slides.findIndex((image) => image.isPrimary)
      setImageIndex(Math.max(0, primaryIndex))
    } catch (error) {
      loaded.current = false
      setGalleryError(error.message)
    }
  }

  const activeImage = images[imageIndex]?.key || primaryImage
  const imageCount = images.length || Number(Boolean(primaryImage))

  useEffect(() => {
    if (!isPopupOpen) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsPopupOpen(false)
      if (imageCount > 1 && event.key === 'ArrowLeft') {
        setImageIndex((index) => (index - 1 + imageCount) % imageCount)
      }
      if (imageCount > 1 && event.key === 'ArrowRight') {
        setImageIndex((index) => (index + 1) % imageCount)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [imageCount, isPopupOpen])

  function showImage(index = imageIndex) {
    setImageIndex(index)
    setIsPopupOpen(true)
  }

  function changeImage(direction) {
    const nextIndex = (imageIndex + direction + imageCount) % imageCount
    setImageIndex(nextIndex)
    showImage(nextIndex)
  }

  return (
    <>
      <div
        aria-label={`${productName} product photos`}
        className={`shop-product-image textile-tone-${tone}`}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setIsActive(false)
        }}
        onFocusCapture={() => {
          setIsActive(true)
          loadGallery()
        }}
        onMouseEnter={() => {
          setIsActive(true)
          loadGallery()
        }}
        onMouseLeave={() => setIsActive(false)}
        onTouchStart={() => {
          setIsActive(true)
          loadGallery()
        }}
        role="group"
      >
        {activeImage
          ? (
            <img
              alt={productName}
              className={roomView ? 'shop-product-photo room-view' : 'shop-product-photo studio-view'}
              loading="lazy"
              src={getProductImageUrl(activeImage)}
            />
          )
          : <div aria-hidden="true" className="shop-textile-placeholder"><span /><i /><b /></div>}
        <button
          aria-label={`Open ${productName} photo`}
          className="shop-gallery-open"
          onClick={() => showImage()}
          type="button"
        />
        {galleryError && <span className="visually-hidden" role="alert">{galleryError}</span>}
        <div aria-label={`${productName} product photo view`} className="shop-photo-view-toggle">
          <button aria-pressed={!roomView} onClick={() => setRoomView(false)} type="button">Studio</button>
          <button aria-pressed={roomView} onClick={() => setRoomView(true)} type="button">Styled</button>
        </div>
        {isActive && imageCount > 1 && (
          <>
            <button
              aria-label={`Previous ${productName} photo`}
              className="shop-gallery-arrow previous"
              onClick={() => changeImage(-1)}
              type="button"
            >
              <Icon name="arrow" size={15} />
            </button>
            <button
              aria-label={`Next ${productName} photo`}
              className="shop-gallery-arrow next"
              onClick={() => changeImage(1)}
              type="button"
            >
              <Icon name="arrow" size={15} />
            </button>
            <span aria-live="polite" className="shop-gallery-counter">{imageIndex + 1} / {imageCount}</span>
          </>
        )}
      </div>
      {isPopupOpen && createPortal(
        <div
          className="shop-gallery-lightbox"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsPopupOpen(false)
          }}
        >
          <section
            aria-label={`${productName} photo gallery`}
            aria-modal="true"
            className="shop-gallery-lightbox-dialog"
            role="dialog"
          >
            <button
              aria-label="Close photo gallery"
              className="shop-gallery-close"
              onClick={() => setIsPopupOpen(false)}
              type="button"
            >×</button>
            <button
              aria-pressed={autoFit}
              className="shop-gallery-fit-toggle"
              onClick={() => setAutoFit((fit) => !fit)}
              type="button"
            >
              {autoFit ? 'मूल आकार' : 'स्क्रीन में फिट करें'}
            </button>
            {activeImage
              ? <img
                alt={`${productName} · photo ${imageIndex + 1}`}
                className={`shop-gallery-lightbox-image${autoFit ? ' auto-fit' : ''}`}
                src={getProductImageUrl(activeImage)}
              />
              : <p className="shop-gallery-empty">Is product ki image nahi hai.</p>}
            {imageCount > 1 && (
              <>
                <button
                  aria-label="Previous photo"
                  className="shop-gallery-arrow previous"
                  onClick={() => setImageIndex((index) => (index - 1 + imageCount) % imageCount)}
                  type="button"
                ><Icon name="arrow" size={20} /></button>
                <button
                  aria-label="Next photo"
                  className="shop-gallery-arrow next"
                  onClick={() => setImageIndex((index) => (index + 1) % imageCount)}
                  type="button"
                ><Icon name="arrow" size={20} /></button>
                <span aria-live="polite" className="shop-gallery-lightbox-counter">
                  {imageIndex + 1} / {imageCount}
                </span>
              </>
            )}
            <p className="shop-gallery-lightbox-title">{productName}</p>
          </section>
        </div>,
        document.body,
      )}
    </>
  )
}

export default ShopProductGallery
