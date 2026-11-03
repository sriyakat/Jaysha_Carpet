import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from '../../category/components/Icon.jsx'
import ShopFooter from '../components/ShopFooter.jsx'
import {
  getProductImageUrl,
  getProductImages,
} from '../../product/api/productApi.js'
import { applyCustomerCoupon, getActiveCoupons, validateCustomerCoupon } from '../../coupon/api/adminCouponApi.js'
import { getPublicProductReviews } from '../../review/api/customerReviewApi.js'
import { getActiveHomepageBanners } from '../../homepageBanners/api/adminHomepageBannerApi.js'
import { getPublicProductVideo } from '../../productVideos/api/publicProductVideoApi.js'
import './ShopPage.css'
import {
  createCustomerOrder,
  getCustomerOrder,
  getCustomerAddresses,
} from '../../customer/api/customerCommerceApi.js'
import {
  createRazorpayOrder,
  getRazorpayConfig,
  verifyRazorpayPayment,
} from '../../customer/api/customerPaymentApi.js'
import {
  addItemToCustomerCart,
  clearCustomerCart,
  clearSavedCart,
  createCustomerCart,
  getCustomerCart,
  getShopProducts,
  readSavedCart,
  removeCustomerCartItem,
  saveCustomerCart,
  updateCustomerCartItem,
} from '../api/cartApi.js'

function value(item, camelName, pascalName, fallback = '') {
  return item?.[camelName] ?? item?.[pascalName] ?? fallback
}

function productId(product) {
  return value(product, 'productId', 'ProductId', product?.id ?? product?.Id)
}

function cartItemId(item) {
  return value(item, 'cartItemId', 'CartItemId', item?.id ?? item?.Id)
}

function imageKey(product) {
  return value(product, 'primaryImageUrl', 'PrimaryImageUrl')
    || value(product, 'primaryImage', 'PrimaryImage')
    || value(product, 'primaryImageStorageKey', 'PrimaryImageStorageKey')
    || value(product, 'imageUrl', 'ImageUrl')
    || value(product, 'imageStorageKey', 'ImageStorageKey')
    || value(product, 'storageKey', 'StorageKey')
}

function getPrice(product) {
  const discount = Number(value(product, 'discountPrice', 'DiscountPrice', 0))
  const regular = Number(value(product, 'price', 'Price', 0))
  return discount > 0 && discount < regular ? discount : regular
}

function getDiscountPercent(product) {
  const regular = Number(value(product, 'price', 'Price', 0))
  const discount = Number(value(product, 'discountPrice', 'DiscountPrice', 0))
  return discount > 0 && discount < regular
    ? Math.round(((regular - discount) / regular) * 100)
    : 0
}

function money(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)
}

function safeBannerUrl(candidate) {
  if (!candidate) return ''

  try {
    const url = new URL(candidate, window.location.origin)
    if (!['http:', 'https:'].includes(url.protocol)) return ''
    return url.origin === window.location.origin
      ? `${url.pathname}${url.search}${url.hash}`
      : url.href
  } catch {
    return ''
  }
}

function getHeroImageUrl(image) {
  if (image?.startsWith('/images/hero/')) return image
  return getProductImageUrl(image)
}

function readCustomerSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem('jaysha-customer-session') || 'null')
    return typeof saved?.token === 'string' && saved.token ? saved : null
  } catch {
    sessionStorage.removeItem('jaysha-customer-session')
    return null
  }
}

function getCustomerCartOwner(session) {
  const customer = session?.customer
  const id = value(customer, 'customerId', 'CustomerId', value(customer, 'userId', 'UserId', ''))
  const email = value(customer, 'email', 'Email', '')
  return String(id || email).trim().toLowerCase()
}

const CUSTOMER_RETURN_TO_KEY = 'jaysha-customer-return-to'
const PENDING_ONLINE_ORDER_KEY = 'jaysha-pending-online-order'

const ONLINE_PAYMENT_METHODS = [
  { id: 'upi', name: 'UPI apps', detail: 'Google Pay · PhonePe · Paytm (if enabled)', icon: '↗' },
  { id: 'card', name: 'Credit or debit card', detail: 'Visa · Mastercard · RuPay', icon: '▤' },
  { id: 'netbanking', name: 'Net banking', detail: 'Pay through your bank', icon: '⌂' },
  { id: 'wallet', name: 'Wallets', detail: 'Available wallets via Razorpay', icon: '◉' },
]

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-razorpay-checkout]')
    if (existingScript) {
      existingScript.addEventListener('load', resolve, { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Razorpay Checkout load nahi ho paya.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.dataset.razorpayCheckout = 'true'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => {
      script.remove()
      reject(new Error('Razorpay Checkout load nahi ho paya.'))
    }
    document.body.appendChild(script)
  })
}

const SUPPLIED_HERO_SLIDES = [
  {
    image: '/images/hero/heritage-rug-showroom.png',
    imageAlt: 'Colourful traditional rugs displayed in a carpet showroom',
    eyebrow: 'SPECIAL OFFER · HERITAGE COLLECTION',
    title: 'Bring home timeless',
    accent: 'Persian style.',
    description: 'Explore special prices on selected rugs and find a statement piece for your home.',
    offerMessage: 'Special prices on selected rugs',
    buttonText: 'Explore offers',
  },
  {
    image: '/images/hero/neutral-sculpted-rug.png',
    imageAlt: 'Soft neutral sculpted rug in a contemporary living room',
    eyebrow: 'SPECIAL OFFER · SOFT NEUTRALS',
    title: 'A softer kind',
    accent: 'of statement.',
    description: 'Find calm, sculptural styles for your room, with special prices on selected designs.',
    offerMessage: 'Special prices on selected rugs',
    buttonText: 'Explore offers',
  },
  {
    image: '/images/hero/round-classic-rug.png',
    imageAlt: 'Round classic floral rug styled in a cosy reading corner',
    eyebrow: 'SPECIAL OFFER · ROUND RUGS',
    title: 'Make room for',
    accent: 'classic charm.',
    description: 'Discover round rugs and traditional motifs, with offers on selected styles.',
    offerMessage: 'Special prices on selected rugs',
    buttonText: 'Explore offers',
  },
  {
    image: '/images/hero/medallion-rug-room.png',
    imageAlt: 'Ornate medallion rug bringing warmth to a bright living room',
    eyebrow: 'SPECIAL OFFER · TIMELESS CRAFT',
    title: 'A little heritage',
    accent: 'underfoot.',
    description: 'Explore detailed medallion designs and special prices on selected rugs.',
    offerMessage: 'Special prices on selected rugs',
    buttonText: 'Explore offers',
  },
  {
    image: '/images/hero/terracotta-modern-rug.png',
    imageAlt: 'Modern terracotta rug in a contemporary living room',
    eyebrow: 'SPECIAL OFFER · MODERN LAYERS',
    title: 'Ground your space',
    accent: 'in warm colour.',
    description: 'Bring a rich, modern feel home with special prices on selected designs.',
    offerMessage: 'Special prices on selected rugs',
    buttonText: 'Explore offers',
  },
  {
    image: '/images/hero/sculptural-color-rug.png',
    imageAlt: 'Sculptural multicolour rug in an elegant interior',
    eyebrow: 'SPECIAL OFFER · COLOURFUL FORMS',
    title: 'Make a bold',
    accent: 'first impression.',
    description: 'Explore expressive shapes and colours, with offers on selected rugs.',
    offerMessage: 'Special prices on selected rugs',
    buttonText: 'Explore offers',
  },
]

const CATEGORY_ARTWORK = [
  'gray-floral-living-room.png',
  'ornate-teal-medallion.png',
  'geometric-runner.png',
  'flower-shaggy-round.png',
  'pastel-scallop-floral.png',
  'jute-geometric-room.png',
  'bird-and-botanical.png',
  'black-contour-organic.png',
  'classic-neutral-fringe.png',
  'ornate-navy-tile.png',
]

const CATEGORY_ORDER = [
  'Modern Rugs',
  'Premium Modern Rugs',
  'Traditional & Persian Rugs',
  'Runner Rugs',
  'Round Rugs',
  'Shaggy & Plush Rugs',
  'Jute & Natural Fiber Rugs',
  'Kids Rugs',
  'Outdoor Rugs',
]

function categoryArtwork(category, index) {
  const name = category.toLowerCase()
  if (name.includes('runner')) return CATEGORY_ARTWORK[2]
  if (name.includes('round')) return CATEGORY_ARTWORK[3]
  if (name.includes('shaggy') || name.includes('plush')) return CATEGORY_ARTWORK[4]
  if (name.includes('jute') || name.includes('natural')) return CATEGORY_ARTWORK[5]
  if (name.includes('kid')) return CATEGORY_ARTWORK[6]
  if (name.includes('outdoor')) return CATEGORY_ARTWORK[7]
  if (name.includes('traditional') || name.includes('persian')) return CATEGORY_ARTWORK[1]
  if (name.includes('premium')) return CATEGORY_ARTWORK[8]
  if (name.includes('modern')) return CATEGORY_ARTWORK[0]
  return CATEGORY_ARTWORK[index % CATEGORY_ARTWORK.length]
}

function ShopPage() {
  const [customerSession, setCustomerSession] = useState(readCustomerSession)
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState(() => readSavedCart(getCustomerCartOwner(readCustomerSession())))
  const [cartData, setCartData] = useState({ summary: null, items: [] })
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingCart, setLoadingCart] = useState(() => Boolean(readSavedCart(getCustomerCartOwner(readCustomerSession()))))
  const [productError, setProductError] = useState('')
  const [cartError, setCartError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All rugs')
  const [sortOrder, setSortOrder] = useState('featured')
  const [activeHeroSlide, setActiveHeroSlide] = useState(0)
  const [homepageBanners, setHomepageBanners] = useState([])
  const [heroPaused, setHeroPaused] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [detailsProduct, setDetailsProduct] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [detailsImages, setDetailsImages] = useState([])
  const [detailsImageIndex, setDetailsImageIndex] = useState(0)
  const [productReviewsResult, setProductReviewsResult] = useState(null)
  const [productVideoResult, setProductVideoResult] = useState(null)
  const [cartOpen, setCartOpen] = useState(window.location.pathname === '/cart')
  const [checkoutView, setCheckoutView] = useState(window.location.pathname === '/checkout')
  const [busyItem, setBusyItem] = useState(null)
  const [addingProduct, setAddingProduct] = useState(null)
  const [checkoutAddresses, setCheckoutAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [loadingCheckoutAddresses, setLoadingCheckoutAddresses] = useState(false)
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [checkoutNotes, setCheckoutNotes] = useState('')
  const [orderConfirmation, setOrderConfirmation] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [couponCode, setCouponCode] = useState('')
  const [couponPreview, setCouponPreview] = useState(null)
  const [activeCoupons, setActiveCoupons] = useState([])
  const [couponError, setCouponError] = useState('')
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [razorpayConfig, setRazorpayConfig] = useState({ enabled: false, keyId: null })
  const [pendingOnlineOrderId, setPendingOnlineOrderId] = useState(
    () => sessionStorage.getItem(PENDING_ONLINE_ORDER_KEY) || '',
  )
  const [pendingOnlineOrder, setPendingOnlineOrder] = useState(null)

  const heroSlides = useMemo(() => {
    const offerProduct = products.find((product) =>
      getDiscountPercent(product) > 0
      && imageKey(product)
      && !value(product, 'shortDescription', 'ShortDescription').startsWith('SAMPLE LISTING'),
    )
    const collectionSlides = [
      ...SUPPLIED_HERO_SLIDES,
      ...homepageBanners.map((banner) => ({
        image: value(banner, 'imageUrl', 'ImageUrl'),
        mobileImage: value(banner, 'mobileImageUrl', 'MobileImageUrl'),
        imageAlt: value(banner, 'title', 'Title', 'Featured rug collection'),
        eyebrow: value(banner, 'subtitle', 'Subtitle') || value(banner, 'promotionCode', 'PromotionCode') || 'JAYSHA CARPET · FEATURED',
        title: value(banner, 'title', 'Title'),
        accent: '',
        description: value(banner, 'description', 'Description', ''),
        buttonText: value(banner, 'buttonText', 'ButtonText', 'Discover the collection'),
        buttonUrl: safeBannerUrl(value(banner, 'buttonUrl', 'ButtonUrl')),
      })),
    ]

    if (!offerProduct) return collectionSlides

    return [...collectionSlides, {
      image: imageKey(offerProduct),
      imageAlt: value(offerProduct, 'productName', 'ProductName', 'Featured rug'),
      eyebrow: `NEW ARRIVAL · SAVE ${getDiscountPercent(offerProduct)}%`,
      title: value(offerProduct, 'productName', 'ProductName', 'Featured rug'),
      accent: 'Special offer',
      description: value(offerProduct, 'shortDescription', 'ShortDescription')
        || 'A new favourite for your home, now at a special price.',
      buttonText: 'Shop this rug',
      product: offerProduct,
      offerPrice: getPrice(offerProduct),
      regularPrice: Number(value(offerProduct, 'price', 'Price', 0)),
      discountPercent: getDiscountPercent(offerProduct),
    }]
  }, [homepageBanners, products])
  const heroSlideCount = heroSlides.length

  useEffect(() => {
    if (heroPaused) return undefined

    const timer = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroSlideCount)
    }, 6500)

    return () => window.clearInterval(timer)
  }, [heroPaused, heroSlideCount])

  useEffect(() => {
    let active = true
    getActiveCoupons()
      .then((payload) => {
        const items = Array.isArray(payload?.data) ? payload.data : []
        if (active) setActiveCoupons(items)
      })
      .catch((error) => {
        console.error('Unable to load active coupon offers:', error)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    getActiveHomepageBanners()
      .then((items) => {
        if (active) setHomepageBanners(items)
      })
      .catch((error) => {
        console.error('Unable to load homepage banners; using built-in collection slides:', error)
      })
    return () => { active = false }
  }, [])

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true)
    setProductError('')
    try {
      const items = await getShopProducts()
      setProducts(items.filter((product) => Boolean(value(product, 'isActive', 'IsActive', true))))
    } catch (error) {
      setProductError(error.message)
    } finally {
      setLoadingProducts(false)
    }
  }, [])

  const loadCart = useCallback(async (savedCart = cart) => {
    if (!savedCart) {
      setCartData({ summary: null, items: [] })
      return
    }

    setLoadingCart(true)
    setCartError('')
    try {
      const payload = await getCustomerCart(customerSession?.token, savedCart.cartId)
      const data = payload?.data || {}
      setCartData({
        summary: data.summary ?? data.Summary ?? null,
        items: Array.isArray(data.items) ? data.items : Array.isArray(data.Items) ? data.Items : [],
      })
    } catch (error) {
      if (error.status === 401 || error.status === 404) {
        clearSavedCart()
        setCart(null)
        setCartData({ summary: null, items: [] })
        setCartError('Aapka purana cart expire ho gaya. Naya cart banane ke liye product add karein.')
      } else {
        setCartError(error.message)
      }
    } finally {
      setLoadingCart(false)
    }
  }, [cart, customerSession])

  useEffect(() => {
    let active = true

    getShopProducts()
      .then((items) => {
        if (active) setProducts(items.filter((product) => Boolean(value(product, 'isActive', 'IsActive', true))))
      })
      .catch((error) => {
        if (active) setProductError(error.message)
      })
      .finally(() => {
        if (active) setLoadingProducts(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!cart) return undefined

    let active = true
    if (!customerSession?.token) {
      return undefined
    }

    getCustomerCart(customerSession.token, cart.cartId)
      .then((payload) => {
        if (!active) return
        const data = payload?.data || {}
        setCartData({
          summary: data.summary ?? data.Summary ?? null,
          items: Array.isArray(data.items) ? data.items : Array.isArray(data.Items) ? data.Items : [],
        })
        setCartError('')
      })
      .catch((error) => {
        if (!active) return
        if (error.status === 401 || error.status === 404) {
          clearSavedCart()
          setCart(null)
          setCartData({ summary: null, items: [] })
          setCartError('Aapka purana cart expire ho gaya. Naya cart banane ke liye product add karein.')
        } else {
          setCartError(error.message)
        }
      })
      .finally(() => {
        if (active) setLoadingCart(false)
      })

    return () => {
      active = false
    }
  }, [cart, customerSession])

  useEffect(() => {
    function handlePopState() {
      setCartOpen(window.location.pathname === '/cart')
      setCheckoutView(window.location.pathname === '/checkout')
      if (window.location.pathname === '/checkout') setLoadingCheckoutAddresses(true)
      setCheckoutError('')
      setCustomerSession(readCustomerSession())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigateCart(open) {
    setCartOpen(open)
    setCheckoutView(false)
    const nextPath = open ? '/cart' : '/shop'
    if (window.location.pathname !== nextPath) window.history.pushState(null, '', nextPath)
  }

  function openProductDetails(product) {
    setDetailsImages([])
    setDetailsError('')
    setDetailsImageIndex(0)
    setLoadingDetails(true)
    setDetailsProduct(product)
  }

  function beginCheckout() {
    if (!customerSession?.token) {
      sessionStorage.setItem(CUSTOMER_RETURN_TO_KEY, '/checkout')
      window.location.assign('/customer/login')
      return
    }

    setCartOpen(false)
    setLoadingCheckoutAddresses(true)
    setCheckoutError('')
    setCheckoutView(true)
    if (window.location.pathname !== '/checkout') window.history.pushState(null, '', '/checkout')
  }

  useEffect(() => {
    if (checkoutView && !customerSession?.token) {
      window.location.replace('/customer/login')
    }
  }, [checkoutView, customerSession?.token])

  useEffect(() => {
    if (!checkoutView || !customerSession?.token) return undefined

    let active = true
    Promise.allSettled([
      getCustomerAddresses(customerSession.token),
      getRazorpayConfig(customerSession.token),
    ]).then(([addressesResult, configResult]) => {
      if (!active) return
      if (addressesResult.status === 'fulfilled') {
        const addresses = addressesResult.value
        setCheckoutAddresses(addresses)
        const defaultAddress = addresses.find((address) =>
          Boolean(value(address, 'isDefault', 'IsDefault', false)))
        setSelectedAddressId(String(
          value(defaultAddress, 'addressId', 'AddressId', value(addresses[0], 'addressId', 'AddressId', '')),
        ))
      } else {
        setCheckoutError(addressesResult.reason.message)
      }
      if (configResult.status === 'fulfilled') {
        setRazorpayConfig(configResult.value)
      } else {
        setRazorpayConfig({ enabled: false, keyId: null })
      }
    }).finally(() => {
      if (active) setLoadingCheckoutAddresses(false)
    })

    return () => { active = false }
  }, [checkoutView, customerSession?.token])

  useEffect(() => {
    if (!checkoutView || !customerSession?.token || !pendingOnlineOrderId) return undefined

    let active = true
    getCustomerOrder(customerSession.token, pendingOnlineOrderId)
      .then((payload) => {
        if (!active) return
        const order = payload?.data?.order
        const status = String(value(order, 'paymentStatus', 'PaymentStatus', '')).toUpperCase()
        if (status === 'PAID') {
          setOrderConfirmation(order)
          setPendingOnlineOrder(null)
          setPendingOnlineOrderId('')
          sessionStorage.removeItem(PENDING_ONLINE_ORDER_KEY)
          clearSavedCart()
          setCart(null)
          setCartData({ summary: null, items: [] })
          return
        }
        setPaymentMethod('upi')
        setPendingOnlineOrder(order || null)
      })
      .catch((error) => {
        if (!active) return
        if (error.status === 404) {
          sessionStorage.removeItem(PENDING_ONLINE_ORDER_KEY)
          setPendingOnlineOrderId('')
        } else {
          setCheckoutError(error.message)
        }
      })

    return () => { active = false }
  }, [checkoutView, customerSession?.token, pendingOnlineOrderId])

  useEffect(() => {
    if (!detailsProduct) return undefined

    function closeOnEscape(event) {
      if (event.key === 'Escape') setDetailsProduct(null)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [detailsProduct])

  useEffect(() => {
    if (!detailsProduct) return undefined
    let active = true
    const id = productId(detailsProduct)
    if (!id) return undefined
    getPublicProductVideo(id)
      .then((item) => {
        if (active) setProductVideoResult({ productId: String(id), item })
      })
      .catch((error) => {
        if (active) setProductVideoResult({ productId: String(id), error: error.message })
      })
    return () => { active = false }
  }, [detailsProduct])

  useEffect(() => {
    if (!detailsProduct) return undefined
    let active = true
    const id = productId(detailsProduct)
    if (!id) return undefined
    getPublicProductReviews(id)
      .then((items) => {
        if (active) setProductReviewsResult({ productId: String(id), items })
      })
      .catch((error) => {
        if (active) setProductReviewsResult({ productId: String(id), error: error.message })
      })
    return () => { active = false }
  }, [detailsProduct])

  useEffect(() => {
    if (!detailsProduct) return undefined

    let active = true
    const id = productId(detailsProduct)

    getProductImages(id).then((images) => {
      if (!active) return
      setDetailsImages(images.slice(0, 8))
    }).catch((error) => {
      if (active) setDetailsError(error.message)
    }).finally(() => {
      if (active) setLoadingDetails(false)
    })

    return () => { active = false }
  }, [detailsProduct])

  const categories = useMemo(
    () => [...new Set(
      products.map((product) => value(product, 'categoryName', 'CategoryName')).filter(Boolean),
    )].sort((first, second) => {
      const firstOrder = CATEGORY_ORDER.indexOf(first)
      const secondOrder = CATEGORY_ORDER.indexOf(second)
      return (firstOrder < 0 ? CATEGORY_ORDER.length : firstOrder)
        - (secondOrder < 0 ? CATEGORY_ORDER.length : secondOrder)
        || first.localeCompare(second)
    }),
    [products],
  )

  const categoryCards = useMemo(
    () => categories.map((category, index) => ({
      name: category,
      count: products.filter((product) => value(product, 'categoryName', 'CategoryName') === category).length,
      image: getProductImageUrl(`/uploads/showcase/${categoryArtwork(category, index)}`),
    })),
    [categories, products],
  )

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filteredProducts = products.filter((product) => {
      const category = value(product, 'categoryName', 'CategoryName')
      const searchable = [
        value(product, 'productName', 'ProductName'),
        category,
        value(product, 'material', 'Material'),
        value(product, 'color', 'Color'),
        value(product, 'size', 'Size'),
      ].join(' ').toLowerCase()
      return searchable.includes(query) && (selectedCategory === 'All rugs' || category === selectedCategory)
    })
    return filteredProducts.sort((first, second) => {
      if (sortOrder === 'price-low') return getPrice(first) - getPrice(second)
      if (sortOrder === 'price-high') return getPrice(second) - getPrice(first)
      if (sortOrder === 'name') {
        return value(first, 'productName', 'ProductName').localeCompare(value(second, 'productName', 'ProductName'))
      }
      return (Number(getDiscountPercent(second) > 0) - Number(getDiscountPercent(first) > 0))
        || Number(value(second, 'isFeatured', 'IsFeatured', false)) - Number(value(first, 'isFeatured', 'IsFeatured', false))
    })
  }, [products, search, selectedCategory, sortOrder])

  const itemCount = cartData.items.reduce((total, item) => total + Number(value(item, 'quantity', 'Quantity', 0)), 0)
  const activeProductId = detailsProduct ? String(productId(detailsProduct)) : ''
  const activeReviewsResult = productReviewsResult?.productId === activeProductId ? productReviewsResult : null
  const productReviews = activeReviewsResult?.items || []
  const reviewsLoading = Boolean(detailsProduct && !activeReviewsResult)
  const reviewsError = activeReviewsResult?.error || ''
  const activeProductVideo = productVideoResult?.productId === activeProductId ? productVideoResult : null
  const currentHeroSlide = activeHeroSlide % heroSlides.length
  const heroSlide = heroSlides[currentHeroSlide]
  const computedTotal = cartData.items.reduce((total, item) => {
    const unitPrice = Number(value(item, 'unitPrice', 'UnitPrice', value(item, 'price', 'Price', 0)))
    return total + unitPrice * Number(value(item, 'quantity', 'Quantity', 0))
  }, 0)
  const cartTotal = Number(value(cartData.summary, 'totalAmount', 'TotalAmount', computedTotal))
  const couponDiscount = Number(value(couponPreview, 'DiscountAmount', 'discountAmount', 0)) || 0
  const checkoutTotal = Math.max(0, cartTotal - couponDiscount)

  async function checkCoupon() {
    if (!customerSession?.token) {
      setCouponError('Coupon use karne ke liye customer account mein sign in karein.')
      return
    }
    if (!couponCode.trim()) {
      setCouponError('Coupon code enter karein.')
      return
    }
    setValidatingCoupon(true)
    setCouponError('')
    setCouponPreview(null)
    try {
      const payload = await validateCustomerCoupon(customerSession.token, couponCode.trim(), cartTotal)
      setCouponPreview(payload?.data || {})
    } catch (error) {
      setCouponError(error.message)
    } finally {
      setValidatingCoupon(false)
    }
  }

  function finishPaidOrder(order) {
    setOrderConfirmation(order)
    setPendingOnlineOrder(null)
    setPendingOnlineOrderId('')
    sessionStorage.removeItem(PENDING_ONLINE_ORDER_KEY)
    clearSavedCart()
    setCart(null)
    setCartData({ summary: null, items: [] })
    setCheckoutNotes('')
  }

  async function openRazorpayCheckout(orderId, method) {
    if (!razorpayConfig.enabled) {
      throw new Error('Online payment abhi configure nahi hai. Razorpay test credentials set karne ke liye store admin se sampark karein.')
    }

    const checkoutOrder = await createRazorpayOrder(customerSession.token, orderId)
    if (checkoutOrder.alreadyPaid) {
      const payload = await getCustomerOrder(customerSession.token, orderId)
      finishPaidOrder(payload?.data?.order)
      return
    }
    await loadRazorpayCheckout()

    return new Promise((resolve, reject) => {
      let settled = false
      const finish = (callback, result) => {
        if (settled) return
        settled = true
        callback(result)
      }
      const options = {
        key: checkoutOrder.keyId,
        amount: checkoutOrder.amount,
        currency: checkoutOrder.currency,
        name: 'Jaysha Carpet',
        description: 'Secure payment for your rug order',
        order_id: checkoutOrder.orderId,
        prefill: {
          name: value(customerSession.customer, 'fullName', 'FullName', value(customerSession.customer, 'name', 'Name')),
          email: value(customerSession.customer, 'email', 'Email'),
          contact: value(customerSession.customer, 'mobileNumber', 'MobileNumber', value(customerSession.customer, 'phone', 'Phone')),
        },
        theme: { color: '#52674f' },
        config: {
          display: {
            blocks: {
              preferred: {
                name: ONLINE_PAYMENT_METHODS.find((item) => item.id === method)?.name || 'Preferred payment method',
                instruments: [{ method }],
              },
            },
            sequence: ['block.preferred'],
            preferences: { show_default_blocks: true },
          },
        },
        handler: async (response) => {
          try {
            const payload = await verifyRazorpayPayment(customerSession.token, orderId, response)
            finishPaidOrder(payload?.order)
            setCheckoutError('')
            resolve()
          } catch (error) {
            setCheckoutError(error.message)
            finish(reject, error)
          }
        },
        modal: {
          ondismiss: () => finish(reject, new Error('Payment complete nahi hua. Aap isi order ke liye dobara payment kar sakte hain.')),
        },
      }

      const checkout = new window.Razorpay(options)
      checkout.on('payment.failed', (event) => {
        const message = event?.error?.description || 'Payment fail ho gaya. Aap isi order ke liye dobara try kar sakte hain.'
        setCheckoutError(message)
        finish(reject, new Error(message))
      })
      checkout.open()
    })
  }

  async function placeOrder(event) {
    event.preventDefault()
    if (!customerSession?.token) {
      window.location.assign('/customer/login')
      return
    }
    if (paymentMethod !== 'COD' && !razorpayConfig.enabled) {
      setCheckoutError('Online payment abhi set up nahi hai. Store owner ko backend .env mein Razorpay Key ID aur Secret configure karke backend restart karna hoga.')
      return
    }
    if (pendingOnlineOrderId) {
      setSubmittingOrder(true)
      setCheckoutError('')
      try {
        await openRazorpayCheckout(pendingOnlineOrderId, paymentMethod === 'COD' ? 'upi' : paymentMethod.toLowerCase())
      } catch (error) {
        setCheckoutError(error.message)
      } finally {
        setSubmittingOrder(false)
      }
      return
    }
    if (!cart?.cartId || cartData.items.length === 0) {
      setCheckoutError('Aapka cart khaali hai. Order place karne se pehle rug add karein.')
      return
    }
    if (!selectedAddressId) {
      setCheckoutError('Order place karne ke liye delivery address chunein.')
      return
    }

    setSubmittingOrder(true)
    setCheckoutError('')
    let customerCartId
    let orderCreated = false
    try {
      customerCartId = await createCustomerCart(customerSession.token)
      for (const item of cartData.items) {
        const id = value(item, 'productId', 'ProductId')
        const quantity = Number(value(item, 'quantity', 'Quantity', 0))
        if (!Number.isInteger(Number(id)) || Number(id) <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
          throw new Error('Cart mein ek item ki details sahi nahi hain. Cart refresh karke phir try karein.')
        }
        await addItemToCustomerCart(
          customerSession.token,
          customerCartId,
          Number(id),
          quantity,
        )
      }

      const payload = await createCustomerOrder(customerSession.token, {
        AddressId: Number(selectedAddressId),
        CartId: customerCartId,
        PaymentMethod: paymentMethod === 'COD' ? 'COD' : 'ONLINE',
        ...(checkoutNotes.trim() ? { CustomerNotes: checkoutNotes.trim() } : {}),
      })
      if (!payload?.data?.order) {
        throw new Error('Order place hua ya nahi, backend se confirmation nahi mili. My orders check karein.')
      }

      let order = payload.data.order
      orderCreated = true
      const orderId = value(order, 'orderId', 'OrderId')
      if (couponPreview && couponCode.trim() && orderId) {
        try {
          await applyCustomerCoupon(customerSession.token, couponCode.trim(), orderId)
          const updatedOrderPayload = await getCustomerOrder(customerSession.token, orderId)
          const updatedOrderData = updatedOrderPayload?.data
          order = updatedOrderData?.order || updatedOrderData || order
          setCouponError('')
        } catch (applyError) {
          setCouponError(`Order create ho gaya, lekin coupon apply nahi ho saka: ${applyError.message}. Order status account mein check karein.`)
          setCouponPreview(null)
        }
      }
      if (paymentMethod === 'COD') {
        finishPaidOrder(order)
      } else {
        const id = value(order, 'orderId', 'OrderId')
        if (!id) throw new Error('Online order create hua lekin order ID nahi mili. My orders mein order check karein.')
        sessionStorage.setItem(PENDING_ONLINE_ORDER_KEY, String(id))
        setPendingOnlineOrderId(String(id))
        setPendingOnlineOrder(order)
        const selectedMethod = paymentMethod.toLowerCase() === 'online' ? 'upi' : paymentMethod.toLowerCase()
        if (selectedMethod !== 'cod') setPaymentMethod(selectedMethod)
        await openRazorpayCheckout(String(id), selectedMethod)
      }
    } catch (error) {
      if (customerCartId && !orderCreated) {
        try {
          await clearCustomerCart(customerSession.token, customerCartId)
        } catch (cleanupError) {
          console.error('Unable to clear the temporary checkout cart:', cleanupError)
        }
      }
      setCheckoutError(error.message)
    } finally {
      setSubmittingOrder(false)
    }
  }

  if (checkoutView) {
    return (
        <main className="shop-page">
          <header className="shop-header">
          <a aria-label="Jaysha Carpet home" className="shop-brand" href="/shop">
            <span className="shop-brand-mark">J</span>
            <span><strong>Jaysha Carpet</strong><small>HANDWOVEN HOME</small></span>
          </a>
          <nav aria-label="Checkout navigation" className="shop-nav">
            <a className="shop-nav-link" href="/shop">Continue browsing</a>
            <a className="shop-nav-link" href="/account">My account</a>
          </nav>
        </header>
        <section className="shop-checkout-state">
          {orderConfirmation ? (
            <>
              <span className="shop-checkout-icon" aria-hidden="true">✓</span>
              <span className="shop-eyebrow">ORDER PLACED</span>
              <h1>Thank you for your order.</h1>
              <p>Your order has been received. You can follow its status from your account.</p>
              {couponError && <p className="shop-checkout-error" role="status">{couponError}</p>}
              <div className="shop-checkout-summary">
                <span>Order {value(orderConfirmation, 'orderNumber', 'OrderNumber', '')}</span>
                <strong>{money(value(orderConfirmation, 'GrandTotal', 'grandTotal', value(orderConfirmation, 'TotalAmount', 'totalAmount', 0)))}</strong>
              </div>
              <div className="shop-checkout-actions">
                <a className="shop-primary-button" href="/account/orders">View my orders</a>
                <a href="/shop">Continue exploring rugs</a>
              </div>
            </>
          ) : (
            <>
              <span className="shop-eyebrow">SECURE CHECKOUT</span>
              <h1>Where should we deliver?</h1>
              <p>Choose a saved address and your preferred payment method.</p>
              {checkoutError && <p className="shop-checkout-error" role="alert">{checkoutError}</p>}
              {loadingCheckoutAddresses ? (
                <p aria-live="polite" className="customer-loading">Saved addresses load ho rahe hain...</p>
              ) : checkoutAddresses.length ? (
                <form className="shop-checkout-form" onSubmit={placeOrder}>
                  <fieldset className="shop-checkout-addresses">
                    <legend>Delivery address</legend>
                    {checkoutAddresses.map((address, index) => {
                      const addressId = value(address, 'addressId', 'AddressId', '')
                      return (
                        <label className="shop-checkout-address" key={addressId || index}>
                          <input
                            checked={selectedAddressId === String(addressId)}
                            name="delivery-address"
                            onChange={() => setSelectedAddressId(String(addressId))}
                            required
                            type="radio"
                            value={addressId}
                          />
                          <span>
                            <strong>{value(address, 'City', 'city', 'Delivery address')}</strong>
                            {Boolean(value(address, 'IsDefault', 'isDefault', false)) && <em>Default</em>}
                            <small>{value(address, 'AddressLine', 'addressLine')}, {value(address, 'City', 'city')}, {value(address, 'State', 'state')} {value(address, 'Pincode', 'pincode')}</small>
                            <small>{value(address, 'MobileNumber', 'mobileNumber')}</small>
                          </span>
                        </label>
                      )
                    })}
                  </fieldset>
                  <a className="shop-checkout-manage-address" href="/account/addresses">Manage saved addresses</a>
                  {pendingOnlineOrderId && (
                    <div className="shop-pending-payment" role="status">
                      <strong>Order {value(pendingOnlineOrder, 'orderNumber', 'OrderNumber', `#${pendingOnlineOrderId}`)} is awaiting payment.</strong>
                      <span>Retry payment to complete this order. Your order will not be duplicated.</span>
                    </div>
                  )}
                  <label className="shop-checkout-notes" htmlFor="checkout-notes">Delivery note <span>Optional</span>
                    <textarea id="checkout-notes" maxLength={500} onChange={(event) => setCheckoutNotes(event.target.value)} placeholder="Any directions for delivery?" rows={3} value={checkoutNotes} />
                  </label>
                  <section aria-label="Coupon code" className="shop-coupon-box">
                    <label className="shop-checkout-notes" htmlFor="checkout-coupon">Coupon code <span>Optional</span>
                      <input autoCapitalize="characters" autoComplete="off" id="checkout-coupon" maxLength={50} onChange={(event) => {
                        setCouponCode(event.target.value.toUpperCase())
                        setCouponPreview(null)
                        setCouponError('')
                      }} placeholder="Enter offer code" value={couponCode} />
                    </label>
                    <button className="shop-checkout-manage-address" disabled={validatingCoupon || !couponCode.trim() || Boolean(pendingOnlineOrderId)} onClick={checkCoupon} type="button">
                      {validatingCoupon ? 'Checking…' : couponPreview ? 'Check again' : 'Apply code'}
                    </button>
                    {couponError && <p className="shop-checkout-error" role="alert">{couponError}</p>}
                    {couponPreview && <p className="shop-coupon-success" role="status">
                      {value(couponPreview, 'Message', 'message', `Coupon ${couponCode} is valid.`)}
                      {couponDiscount > 0 ? ` Savings: ${money(couponDiscount)}.` : ' Discount will be applied to your order after it is created.'}
                    </p>}
                    {activeCoupons.length > 0 && <p className="shop-coupon-offers">Available offers: {activeCoupons.map((coupon) => value(coupon, 'CouponCode', 'couponCode')).filter(Boolean).join(' · ')}</p>}
                  </section>
                  <fieldset className="shop-payment-methods">
                    <legend>Payment method</legend>
                    <label className={`shop-payment-option${paymentMethod === 'COD' ? ' selected' : ''}${pendingOnlineOrderId ? ' unavailable' : ''}`}>
                      <input
                        checked={paymentMethod === 'COD'}
                        disabled={Boolean(pendingOnlineOrderId)}
                        name="checkout-payment"
                        onChange={() => setPaymentMethod('COD')}
                        type="radio"
                        value="COD"
                      />
                      <span className="shop-payment-icon">₹</span>
                      <span className="shop-payment-copy"><strong>Cash on delivery</strong><small>Pay when your order arrives</small></span>
                      {paymentMethod === 'COD' && <span aria-hidden="true" className="shop-payment-check">✓</span>}
                    </label>
                    {ONLINE_PAYMENT_METHODS.map((method) => (
                      <label
                        className={`shop-payment-option${paymentMethod === method.id ? ' selected' : ''}`}
                        key={method.id}
                      >
                        <input
                          checked={paymentMethod === method.id}
                          name="checkout-payment"
                          onChange={() => setPaymentMethod(method.id)}
                          type="radio"
                          value={method.id}
                        />
                        <span className="shop-payment-icon">{method.icon}</span>
                        <span className="shop-payment-copy"><strong>{method.name}</strong><small>{method.detail}</small></span>
                        {paymentMethod === method.id && <span aria-hidden="true" className="shop-payment-check">✓</span>}
                      </label>
                    ))}
                    {!razorpayConfig.enabled && (
                      <p className="shop-payment-config-note">
                        Online options can be selected. To accept payment, the store must configure Razorpay credentials.
                      </p>
                    )}
                  </fieldset>
                  <p aria-live="polite" className="shop-payment-selection">
                    {pendingOnlineOrderId
                      ? 'Complete payment for your existing order to avoid creating a duplicate.'
                      : paymentMethod === 'COD'
                        ? 'Selected: pay in cash when your order is delivered.'
                        : `Selected: pay securely using ${ONLINE_PAYMENT_METHODS.find((method) => method.id === paymentMethod)?.name || 'online payment'}.`}
                  </p>
                  <div className="shop-checkout-summary">
                    <span>
                      {pendingOnlineOrderId
                        ? `Order ${value(pendingOnlineOrder, 'orderNumber', 'OrderNumber', `#${pendingOnlineOrderId}`)} · payment pending`
                        : `${itemCount} ${itemCount === 1 ? 'piece' : 'pieces'} · ${paymentMethod === 'COD' ? 'Cash on delivery' : 'Online payment'}`}
                    </span>
                    <strong>{money(pendingOnlineOrder
                      ? value(pendingOnlineOrder, 'grandTotal', 'GrandTotal', value(pendingOnlineOrder, 'totalAmount', 'TotalAmount', cartTotal))
                      : checkoutTotal)}</strong>
                  </div>
                  <button
                    className="shop-primary-button"
                    disabled={submittingOrder || (!pendingOnlineOrderId && itemCount === 0)}
                    type="submit"
                  >
                    {submittingOrder
                      ? (pendingOnlineOrderId ? 'Opening secure payment...' : 'Placing order...')
                      : pendingOnlineOrderId
                        ? 'Retry payment'
                        : paymentMethod === 'COD'
                          ? 'Place order · Cash on delivery'
                          : 'Continue to secure payment'}
                  </button>
                </form>
              ) : (
                <div className="shop-checkout-no-address">
                  <p>{checkoutError ? 'Saved addresses load nahi ho paye.' : 'Order place karne se pehle ek delivery address add karein.'}</p>
                  {pendingOnlineOrderId && (
                    <button
                      className="shop-primary-button"
                      disabled={submittingOrder}
                      onClick={async () => {
                        setSubmittingOrder(true)
                        setCheckoutError('')
                        try {
                          await openRazorpayCheckout(pendingOnlineOrderId, paymentMethod === 'COD' ? 'upi' : paymentMethod)
                        } catch (error) {
                          setCheckoutError(error.message)
                        } finally {
                          setSubmittingOrder(false)
                        }
                      }}
                      type="button"
                    >
                      {submittingOrder ? 'Opening secure payment...' : 'Retry payment for pending order'}
                    </button>
                  )}
                  <a className="shop-primary-button" href="/account/addresses">Add delivery address</a>
                </div>
              )}
              <div className="shop-checkout-actions">
                <button className="shop-continue-button" onClick={() => navigateCart(true)} type="button">Review your cart</button>
                <a href="/shop">Continue exploring rugs</a>
              </div>
              <small>Order total and stock are verified securely by the server before confirmation.</small>
            </>
          )}
        </section>
      </main>
    )
  }

  async function ensureCart() {
    const owner = getCustomerCartOwner(customerSession)
    if (cart && cart.customerId === owner) return cart
    const cartId = await createCustomerCart(customerSession.token)
    const customerCart = { cartId, customerId: owner }
    if (owner) saveCustomerCart(customerCart)
    return customerCart
  }

  async function addProduct(product) {
    if (!customerSession?.token) {
      sessionStorage.setItem(CUSTOMER_RETURN_TO_KEY, '/shop')
      window.location.assign('/customer/login')
      return false
    }

    const id = productId(product)
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      setProductError('Product ID missing hai, is product ko cart mein add nahi kar sakte.')
      return false
    }

    setAddingProduct(id)
    setNotice('')
    setProductError('')
    setCartError('')
    let activeCart = cart
    try {
      activeCart = await ensureCart()
      await addItemToCustomerCart(customerSession.token, activeCart.cartId, Number(id), 1)
      const payload = await getCustomerCart(customerSession.token, activeCart.cartId)
      const data = payload?.data || {}
      setCart(activeCart)
      if (activeCart.customerId) saveCustomerCart(activeCart)
      setCartData({
        summary: data.summary ?? data.Summary ?? null,
        items: Array.isArray(data.items) ? data.items : Array.isArray(data.Items) ? data.Items : [],
      })
      setLoadingCart(false)
      setNotice(`${value(product, 'productName', 'ProductName', 'Product')} cart mein add ho gaya.`)
      return true
    } catch (error) {
      if (activeCart && !cart) setCart(activeCart)
      setCartError(error.message)
      return false
    } finally {
      setAddingProduct(null)
    }
  }

  async function handleDetailsPurchase(buyNow) {
    if (!await addProduct(detailsProduct)) return

    setDetailsProduct(null)
    if (buyNow) beginCheckout()
  }

  async function updateQuantity(item, quantity) {
    const itemId = cartItemId(item)
    if (!cart || !itemId) return

    setBusyItem(itemId)
    setCartError('')
    try {
      await updateCustomerCartItem(customerSession.token, cart.cartId, itemId, quantity)
      await loadCart(cart)
    } catch (error) {
      setCartError(error.message)
    } finally {
      setBusyItem(null)
    }
  }

  async function removeItem(item) {
    const itemId = cartItemId(item)
    if (!cart || !itemId) return

    setBusyItem(itemId)
    setCartError('')
    try {
      await removeCustomerCartItem(customerSession.token, cart.cartId, itemId)
      await loadCart(cart)
    } catch (error) {
      setCartError(error.message)
    } finally {
      setBusyItem(null)
    }
  }

  async function emptyCart() {
    if (!cart || !window.confirm('Cart ke saare products remove kar dein?')) return
    setLoadingCart(true)
    setCartError('')
    try {
      await clearCustomerCart(customerSession.token, cart.cartId)
      await loadCart(cart)
    } catch (error) {
      setCartError(error.message)
    } finally {
      setLoadingCart(false)
    }
  }

  return (
    <main className="shop-page">
      <div className="shop-announcement">
        <span>HANDWOVEN RUGS · MADE TO FEEL LIKE HOME</span>
        <span>Thoughtful textures for everyday living</span>
      </div>
      <header className="shop-header">
        <a aria-label="Jaysha Carpet home" className="shop-brand" href="/shop" onClick={(event) => { event.preventDefault(); navigateCart(false) }}>
          <span className="shop-brand-mark">J</span>
          <span><strong>Jaysha Carpet</strong><small>HANDWOVEN HOME</small></span>
        </a>
        <nav aria-label="Shop navigation" className="shop-nav">
          <a className={!cartOpen ? 'shop-nav-link active' : 'shop-nav-link'} href="/shop" onClick={(event) => { event.preventDefault(); navigateCart(false) }}>Shop</a>
          <a className="shop-nav-link" href={customerSession ? '/account' : '/customer/login'}>
            {customerSession ? 'My account' : 'Sign in'}
          </a>
          <a className="shop-admin-login" href="/admin/login">Admin login</a>
          <button aria-label={`Open cart, ${itemCount} items`} className="shop-cart-button" onClick={() => navigateCart(true)} type="button">
            <Icon name="box" size={18} />
            <span>Cart</span>
            <strong>{itemCount}</strong>
          </button>
        </nav>
      </header>

      <section aria-label="Featured rug collections" aria-roledescription="carousel" className={`shop-hero shop-hero-editorial has-hero-image${heroSlide.product || heroSlide.offerMessage ? ' has-hero-offer' : ''}`}>
        <picture className="shop-hero-picture">
          {heroSlide.mobileImage && <source media="(max-width: 640px)" srcSet={getHeroImageUrl(heroSlide.mobileImage)} />}
          <img
            alt={heroSlide.imageAlt || ''}
            className="shop-hero-photo"
            fetchPriority="high"
            key={heroSlide.image}
            src={getHeroImageUrl(heroSlide.image)}
          />
        </picture>
        <div aria-hidden="true" className="shop-hero-shade" />
        <div className="shop-hero-copy">
          <span className="shop-eyebrow">{heroSlide.eyebrow}</span>
          <h1>{heroSlide.title}{heroSlide.accent && <><br /><em>{heroSlide.accent}</em></>}</h1>
          <p>{heroSlide.description}</p>
          {heroSlide.product && <div className="shop-hero-offer-pricing">
            <span>Now <strong>{money(heroSlide.offerPrice)}</strong></span>
            <del>{money(heroSlide.regularPrice)}</del>
            <b>Save {heroSlide.discountPercent}%</b>
          </div>}
          {heroSlide.offerMessage && !heroSlide.product && <div className="shop-hero-offer-pricing">
            <span><strong>Special offer</strong></span>
            <b>Selected rugs</b>
          </div>}
          {heroSlide.product
            ? <button className="shop-hero-button" onClick={() => openProductDetails(heroSlide.product)} type="button">
              {heroSlide.buttonText} <span aria-hidden="true">→</span>
            </button>
            : heroSlide.offerMessage
              ? <button className="shop-hero-button" onClick={() => document.getElementById('shop-products')?.scrollIntoView({ behavior: 'smooth' })} type="button">
                {heroSlide.buttonText} <span aria-hidden="true">→</span>
              </button>
            : heroSlide.buttonUrl
            ? <a className="shop-hero-button" href={heroSlide.buttonUrl}>{heroSlide.buttonText} <span aria-hidden="true">→</span></a>
            : <button className="shop-hero-button" onClick={() => document.getElementById('shop-products')?.scrollIntoView({ behavior: 'smooth' })} type="button">
              {heroSlide.buttonText || 'Discover the collection'} <span aria-hidden="true">↓</span>
            </button>}
        </div>
        <span className="shop-hero-caption">{heroSlide.eyebrow}</span>
        <div className="shop-hero-controls">
          <button
            aria-label="Previous featured collection"
            className="shop-hero-arrow"
            onClick={() => setActiveHeroSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length)}
            type="button"
          >←</button>
          <div aria-label="Choose featured collection" className="shop-hero-dots">
            {heroSlides.map((slide, index) => (
              <button
                aria-current={currentHeroSlide === index ? 'true' : undefined}
                aria-label={`Show slide ${index + 1}: ${slide.eyebrow}`}
                className={currentHeroSlide === index ? 'shop-hero-dot active' : 'shop-hero-dot'}
                key={slide.image}
                onClick={() => setActiveHeroSlide(index)}
                type="button"
              />
            ))}
          </div>
          <button
            aria-label="Next featured collection"
            className="shop-hero-arrow"
            onClick={() => setActiveHeroSlide((current) => (current + 1) % heroSlides.length)}
            type="button"
          >→</button>
          <button
            aria-label={heroPaused ? 'Play automatic slides' : 'Pause automatic slides'}
            className="shop-hero-pause"
            onClick={() => setHeroPaused((paused) => !paused)}
            type="button"
          >{heroPaused ? 'Play' : 'Pause'}</button>
        </div>
      </section>

      <section aria-labelledby="shop-categories-title" className="shop-category-showcase">
        <div className="shop-category-heading">
          <span className="shop-eyebrow">A RUG FOR EVERY ROOM</span>
          <h2 id="shop-categories-title">Find your kind of comfort</h2>
          <p>Explore thoughtfully chosen textures, shapes, and styles for your home.</p>
        </div>
        <div className="shop-category-grid">
          {categoryCards.map((category, index) => (
            <button
              className="shop-category-card"
              key={category.name}
              onClick={() => {
                setSelectedCategory(category.name)
                document.getElementById('shop-products')?.scrollIntoView({ behavior: 'smooth' })
              }}
              type="button"
            >
              <img alt="" loading={index < 4 ? 'eager' : 'lazy'} src={category.image} />
              <span className="shop-category-shade" />
              <span className="shop-category-card-copy">
                <strong>{category.name}</strong>
                <small>{category.count} {category.count === 1 ? 'design' : 'designs'} <span aria-hidden="true">→</span></small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="shop-collection" id="shop-products">
        <div className="shop-section-heading">
          <div>
            <span className="shop-eyebrow">NEW COLLECTION</span>
            <h2>New rugs, special offers</h2>
            <p>Explore the latest rugs and see offer prices on selected designs.</p>
          </div>
          <div className="shop-collection-tools">
            <label className="shop-search">
              <Icon name="search" size={17} />
              <input aria-label="Search collection" onChange={(event) => setSearch(event.target.value)} placeholder="Search rugs..." type="search" value={search} />
            </label>
            <label className="shop-sort">
              <span>Sort by</span>
              <select aria-label="Sort products" onChange={(event) => setSortOrder(event.target.value)} value={sortOrder}>
                <option value="featured">Featured</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>
        </div>

        <nav aria-label="Filter by category" className="shop-category-filters">
          <button
            aria-pressed={selectedCategory === 'All rugs'}
            className={selectedCategory === 'All rugs' ? 'shop-category-chip selected' : 'shop-category-chip'}
            onClick={() => setSelectedCategory('All rugs')}
            type="button"
          >
            All rugs
          </button>
          {categories.map((category) => (
            <button
              aria-pressed={selectedCategory === category}
              className={selectedCategory === category ? 'shop-category-chip selected' : 'shop-category-chip'}
              key={category}
              onClick={() => setSelectedCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </nav>

        {notice && <p className="shop-notice" role="status">{notice}</p>}
        {productError && <p className="shop-error" role="alert">{productError}</p>}
        {loadingProducts ? (
          <div aria-live="polite" className="shop-loading"><span className="spinner" />Collection load ho rahi hai...</div>
        ) : productError ? (
          <div className="shop-empty-state">
            <h3>Collection abhi load nahi hui</h3>
            <p>{productError}</p>
            <button className="shop-secondary-button" onClick={loadProducts} type="button">Try again</button>
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="shop-empty-state">
            <h3>{search ? 'Koi matching rug nahi mila' : 'Collection tayyar ho rahi hai'}</h3>
            <p>{search ? 'Search ko badal kar dobara try karein.' : 'Products available hote hi yahan dikhai denge.'}</p>
          </div>
        ) : (
          <div className="shop-product-grid">
            {visibleProducts.map((product, index) => {
              const id = productId(product)
              const name = value(product, 'productName', 'ProductName', 'Handwoven rug')
              const category = value(product, 'categoryName', 'CategoryName', 'Jaysha collection')
              const price = getPrice(product)
              const oldPrice = Number(value(product, 'price', 'Price', 0))
              const offerPercent = getDiscountPercent(product)
              const picture = getProductImageUrl(imageKey(product))
              const isSampleProduct = value(product, 'shortDescription', 'ShortDescription').startsWith('SAMPLE LISTING')

              return (
                <article className="shop-product-card" key={id ?? index}>
                  <div className={`shop-product-image textile-tone-${index % 4}`}>
                    {picture
                      ? <img alt={name} loading="lazy" src={picture} />
                      : <div aria-hidden="true" className="shop-textile-placeholder"><span /><i /><b /></div>}
                    {Boolean(value(product, 'isFeatured', 'IsFeatured', false)) && <span className="shop-featured-badge">Bestseller</span>}
                    {offerPercent > 0 && <span className="shop-offer-badge">{offerPercent}% OFF</span>}
                    {isSampleProduct && <span className="shop-sample-badge">SAMPLE · EXAMPLE PRICE</span>}
                    <span className="shop-product-number">{String(index + 1).padStart(2, '0')}</span>
                    <button className="shop-quick-view" onClick={() => openProductDetails(product)} type="button">Quick view</button>
                  </div>
                  <div className="shop-product-info">
                    <span className="shop-product-category">{category}</span>
                    <h3>{name}</h3>
                    <div className="shop-product-meta">
                      <span>{value(product, 'material', 'Material', 'Handwoven')}</span>
                      {value(product, 'size', 'Size') && <span>{value(product, 'size', 'Size')}</span>}
                    </div>
                    <div className="shop-product-buy">
                      <span className="shop-price">{money(price)}{oldPrice > price && <del>{money(oldPrice)}</del>}</span>
                      <button
                        aria-label={`Buy ${name} now`}
                        className="shop-add-button"
                        disabled={addingProduct !== null}
                        onClick={() => openProductDetails(product)}
                        type="button"
                      >
                        <Icon name="plus" size={16} /><span>Buy now</span>
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <ShopFooter
        customerSession={customerSession}
        onCartClick={() => navigateCart(true)}
        onShopClick={() => navigateCart(false)}
      />

      {detailsProduct && (
        <div className="shop-details-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDetailsProduct(null)
        }}>
          <section aria-labelledby="shop-details-title" aria-modal="true" className="shop-details-modal" role="dialog">
            <button aria-label="Close product details" className="shop-details-close" onClick={() => setDetailsProduct(null)} type="button">×</button>
            <div>
              <div className={`shop-details-image textile-tone-${products.indexOf(detailsProduct) % 4}`}>
                {getProductImageUrl(detailsImages[detailsImageIndex] ? imageKey(detailsImages[detailsImageIndex]) : imageKey(detailsProduct))
                  ? <img alt={value(detailsProduct, 'productName', 'ProductName', 'Handwoven rug')} src={getProductImageUrl(detailsImages[detailsImageIndex] ? imageKey(detailsImages[detailsImageIndex]) : imageKey(detailsProduct))} />
                  : <div aria-hidden="true" className="shop-textile-placeholder"><span /><i /><b /></div>}
              </div>
              {detailsImages.length > 1 && (
                <div aria-label="Product photos" className="shop-details-thumbnails">
                  {detailsImages.map((image, index) => (
                    <button
                      aria-label={`Show product photo ${index + 1}`}
                      aria-pressed={detailsImageIndex === index}
                      className={detailsImageIndex === index ? 'selected' : ''}
                      key={value(image, 'productImageId', 'ProductImageId', index)}
                      onClick={() => setDetailsImageIndex(index)}
                      type="button"
                    >
                      <img alt="" src={getProductImageUrl(imageKey(image))} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="shop-details-copy">
              <span className="shop-eyebrow">{value(detailsProduct, 'categoryName', 'CategoryName', 'Jaysha collection')}</span>
              <h2 id="shop-details-title">{value(detailsProduct, 'productName', 'ProductName', 'Handwoven rug')}</h2>
              {value(detailsProduct, 'shortDescription', 'ShortDescription').startsWith('SAMPLE LISTING') && (
                <p className="shop-sample-note">Sample listing · Example price only; confirm actual price and availability before purchase.</p>
              )}
              <p>{value(detailsProduct, 'description', 'Description', 'Thoughtfully woven to bring warmth, texture, and a lasting sense of comfort to your home.')}</p>
              {activeProductVideo?.item && value(activeProductVideo.item, 'storageKey', 'StorageKey') && <video className="shop-product-video" controls preload="metadata" src={getProductImageUrl(value(activeProductVideo.item, 'storageKey', 'StorageKey'))}>
                Your browser does not support product video playback.
              </video>}
              {activeProductVideo?.error && <p className="shop-details-status" role="status">{activeProductVideo.error}</p>}
              <dl>
                <div><dt>Material</dt><dd>{value(detailsProduct, 'material', 'Material', 'Handwoven')}</dd></div>
                {value(detailsProduct, 'size', 'Size') && <div><dt>Size</dt><dd>{value(detailsProduct, 'size', 'Size')}</dd></div>}
                {value(detailsProduct, 'color', 'Color') && <div><dt>Color</dt><dd>{value(detailsProduct, 'color', 'Color')}</dd></div>}
              </dl>
              <section aria-label="Customer reviews" className="shop-product-reviews">
                <div className="shop-product-reviews-heading"><h3>Customer reviews</h3><span>{productReviews.length}</span></div>
                {reviewsLoading ? <p className="shop-details-status">Reviews loading…</p> : reviewsError ? <p className="shop-details-status">{reviewsError}</p> : productReviews.length === 0 ? <p className="shop-details-status">No published reviews yet. <a href={customerSession ? '/account/reviews' : '/customer/login'}>{customerSession ? 'Write a review' : 'Sign in to review'}</a></p> : <div className="shop-product-reviews-list">{productReviews.slice(0, 4).map((review, index) => <article key={value(review, 'reviewId', 'ReviewId', index)}><strong>{value(review, 'customerName', 'CustomerName', 'Customer')} <span>{'★'.repeat(Number(value(review, 'rating', 'Rating', 0)))}</span></strong><p>{value(review, 'reviewText', 'ReviewText', 'Rated this product.')}</p></article>)}</div>}
              </section>
              {loadingDetails && <p aria-live="polite" className="shop-details-status">Product images load ho rahi hain...</p>}
              {detailsError && <p className="shop-error" role="alert">{detailsError}</p>}
              <div className="shop-details-buy">
                <strong>
                  {money(getPrice(detailsProduct))}
                  {getDiscountPercent(detailsProduct) > 0 && <del>{money(value(detailsProduct, 'price', 'Price'))}</del>}
                </strong>
                <div className="shop-details-actions">
                  <button
                    className="shop-secondary-button"
                    disabled={addingProduct !== null
                      || loadingDetails
                      || Number(value(detailsProduct, 'stockQuantity', 'StockQuantity', 1)) <= 0}
                    onClick={() => handleDetailsPurchase(false)}
                    type="button"
                  >
                    {addingProduct === productId(detailsProduct) ? 'Adding...' : 'Add to cart'}
                  </button>
                  <button
                    className="shop-primary-button"
                    disabled={addingProduct !== null
                      || loadingDetails
                      || Number(value(detailsProduct, 'stockQuantity', 'StockQuantity', 1)) <= 0}
                    onClick={() => handleDetailsPurchase(true)}
                    type="button"
                  >
                    {addingProduct === productId(detailsProduct) ? 'Please wait...' : 'Buy now'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {cartOpen && (
        <div className="shop-cart-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busyItem) navigateCart(false) }}>
          <aside aria-labelledby="shop-cart-title" aria-modal="true" className="shop-cart-panel" role="dialog">
            <header className="shop-cart-header">
              <div><span className="shop-eyebrow">YOUR SELECTION</span><h2 id="shop-cart-title">Shopping cart <span>({itemCount})</span></h2></div>
              <button aria-label="Close cart" className="shop-cart-close" onClick={() => navigateCart(false)} type="button"><Icon name="close" size={20} /></button>
            </header>

            {cartError && (
              <div className="shop-cart-error" role="alert">
                <p className="shop-error">{cartError}</p>
                <button className="shop-secondary-button" onClick={() => loadCart()} type="button">Retry</button>
              </div>
            )}
            {loadingCart ? (
              <div aria-live="polite" className="shop-loading"><span className="spinner" />Cart update ho raha hai...</div>
            ) : cartData.items.length === 0 ? (
              <div className="shop-cart-empty">
                <span className="cart-empty-art"><Icon name="box" size={28} /></span>
                <h3>Your cart is waiting</h3>
                <p>Collection mein se apna favourite rug chunein.</p>
                <button className="shop-primary-button" onClick={() => navigateCart(false)} type="button">Explore rugs</button>
              </div>
            ) : (
              <>
                <div className="shop-cart-items">
                  {cartData.items.map((item, index) => {
                    const id = cartItemId(item)
                    const name = value(item, 'productName', 'ProductName', 'Carpet')
                    const quantity = Number(value(item, 'quantity', 'Quantity', 1))
                    const unitPrice = Number(value(item, 'unitPrice', 'UnitPrice', value(item, 'price', 'Price', 0)))
                    const picture = getProductImageUrl(imageKey(item))
                    return (
                      <article className="shop-cart-item" key={id ?? index}>
                        <div className="shop-cart-item-image">{picture ? <img alt="" src={picture} /> : <span className={`shop-textile-placeholder textile-tone-${index % 4}`} />}</div>
                        <div className="shop-cart-item-details">
                          <span>{value(item, 'categoryName', 'CategoryName', 'Jaysha collection')}</span>
                          <h3>{name}</h3>
                          <strong>{money(unitPrice)}</strong>
                          <div className="shop-quantity-control">
                            <button aria-label={`Decrease ${name} quantity`} disabled={busyItem === id || quantity <= 1} onClick={() => updateQuantity(item, quantity - 1)} type="button">−</button>
                            <span>{quantity}</span>
                            <button aria-label={`Increase ${name} quantity`} disabled={busyItem === id} onClick={() => updateQuantity(item, quantity + 1)} type="button">+</button>
                            <button className="shop-remove-item" disabled={busyItem === id} onClick={() => removeItem(item)} type="button">Remove</button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
                <div className="shop-cart-summary">
                  <div><span>Subtotal</span><strong>{money(cartTotal)}</strong></div>
                  <p>Shipping and taxes calculated at checkout.</p>
                  <button className="shop-primary-button" onClick={beginCheckout} type="button">
                    {customerSession ? 'Continue to checkout' : 'Sign in to checkout'}
                  </button>
                  <button className="shop-continue-button" onClick={() => navigateCart(false)} type="button">Continue shopping</button>
                  <button className="shop-clear-cart" onClick={emptyCart} type="button">Clear cart</button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </main>
  )
}

export default ShopPage
