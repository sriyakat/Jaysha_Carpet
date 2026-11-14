import { useEffect, useState } from 'react'
import Icon from '../../category/components/Icon.jsx'

function readProduct(product, camelName, pascalName, fallback = '') {
  return product?.[camelName] ?? product?.[pascalName] ?? fallback
}

function productValues(product) {
  return {
    CategoryId: readProduct(product, 'categoryId', 'CategoryId'),
    ProductName: readProduct(product, 'productName', 'ProductName'),
    Slug: readProduct(product, 'slug', 'Slug'),
    SKU: readProduct(product, 'sku', 'SKU'),
    ShortDescription: readProduct(product, 'shortDescription', 'ShortDescription'),
    Description: readProduct(product, 'description', 'Description'),
    Price: readProduct(product, 'price', 'Price'),
    DiscountPrice: readProduct(product, 'discountPrice', 'DiscountPrice'),
    UsdPrice: readProduct(product, 'usdPrice', 'UsdPrice'),
    UsdDiscountPrice: readProduct(product, 'usdDiscountPrice', 'UsdDiscountPrice'),
    StockQuantity: readProduct(product, 'stockQuantity', 'StockQuantity', 0),
    Material: readProduct(product, 'material', 'Material'),
    Size: readProduct(product, 'size', 'Size'),
    Shape: readProduct(product, 'shape', 'Shape'),
    Color: readProduct(product, 'color', 'Color'),
    PileHeight: readProduct(product, 'pileHeight', 'PileHeight'),
    ManufacturingDetails: readProduct(product, 'manufacturingDetails', 'ManufacturingDetails'),
    IsFeatured: readProduct(product, 'isFeatured', 'IsFeatured', false),
    IsActive: readProduct(product, 'isActive', 'IsActive', true),
  }
}

function ProductFormModal({ product, categories, saving, error, onClose, onSubmit }) {
  const [values, setValues] = useState(() => productValues(product))
  const [fieldErrors, setFieldErrors] = useState({})
  const [slugEdited, setSlugEdited] = useState(Boolean(product))
  const isEditing = Boolean(product)

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !saving) onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, saving])

  function updateField(event) {
    const { name, value, type, checked } = event.target
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
  }

  function updateName(event) {
    const ProductName = event.target.value
    setFieldErrors((current) => ({ ...current, ProductName: '' }))
    setValues((current) => ({
      ...current,
      ProductName,
      ...(!slugEdited
        ? { Slug: ProductName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
        : {}),
    }))
  }

  function submitForm(event) {
    event.preventDefault()
    const errors = {}
    if (!values.ProductName.trim()) errors.ProductName = 'उत्पाद का नाम दर्ज करें।'
    if (!values.CategoryId || !Number.isInteger(Number(values.CategoryId))) errors.CategoryId = 'उत्पाद की श्रेणी चुनें।'
    if (values.SKU.trim().length > 60) errors.SKU = 'SKU 60 अक्षरों से अधिक नहीं होना चाहिए।'
    if (values.Slug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.Slug.trim().toLowerCase())) {
      errors.Slug = 'URL नाम में केवल छोटे अंग्रेज़ी अक्षर, अंक और हाइफ़न इस्तेमाल करें।'
    }
    const price = Number(values.Price)
    if (!Number.isFinite(price) || price <= 0) errors.Price = 'कीमत शून्य से अधिक होनी चाहिए।'
    if (values.DiscountPrice !== '' && (
      !Number.isFinite(Number(values.DiscountPrice))
      || Number(values.DiscountPrice) < 0
      || Number(values.DiscountPrice) >= price
    )) errors.DiscountPrice = 'छूट की कीमत शून्य या उससे अधिक और मूल कीमत से कम होनी चाहिए।'
    const usdPrice = Number(values.UsdPrice)
    if (!Number.isFinite(usdPrice) || usdPrice <= 0) errors.UsdPrice = 'USD कीमत शून्य से अधिक होनी चाहिए।'
    if (values.UsdDiscountPrice !== '' && (
      !Number.isFinite(Number(values.UsdDiscountPrice))
      || Number(values.UsdDiscountPrice) < 0
      || Number(values.UsdDiscountPrice) >= usdPrice
    )) errors.UsdDiscountPrice = 'USD छूट की कीमत शून्य या उससे अधिक और मूल USD कीमत से कम होनी चाहिए।'
    if (!Number.isInteger(Number(values.StockQuantity)) || Number(values.StockQuantity) < 0) {
      errors.StockQuantity = 'स्टॉक की मात्रा शून्य या उससे बड़ी पूर्ण संख्या होनी चाहिए।'
    }
    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors)
      return
    }

    onSubmit({
      ...values,
      CategoryId: Number(values.CategoryId),
      ProductName: values.ProductName.trim(),
      Slug: values.Slug.trim().toLowerCase(),
      SKU: values.SKU.trim(),
      ShortDescription: values.ShortDescription.trim() || null,
      Description: values.Description.trim() || null,
      Price: Number(values.Price),
      DiscountPrice: values.DiscountPrice === '' ? null : Number(values.DiscountPrice),
      UsdPrice: Number(values.UsdPrice),
      UsdDiscountPrice: values.UsdDiscountPrice === '' ? null : Number(values.UsdDiscountPrice),
      StockQuantity: Number(values.StockQuantity),
      Material: values.Material.trim() || null,
      Size: values.Size.trim() || null,
      Shape: values.Shape.trim() || null,
      Color: values.Color.trim() || null,
      PileHeight: values.PileHeight.trim() || null,
      ManufacturingDetails: values.ManufacturingDetails.trim() || null,
    })
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose()
      }}
    >
      <section
        aria-labelledby="product-modal-title"
        aria-modal="true"
        className="modal product-modal"
        role="dialog"
      >
        <header className="modal-header">
          <div>
            <h2 id="product-modal-title">{isEditing ? 'Edit product' : 'Add a product'}</h2>
            <p>{isEditing ? 'Product details update karein.' : 'Apne catalog mein naya carpet ya rug add karein.'}</p>
          </div>
          <button
            aria-label="Close dialog"
            className="icon-button modal-close"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            <Icon name="close" />
          </button>
        </header>

        <form className="category-form" noValidate onSubmit={submitForm}>
          <div className="form-grid">
            <div className="form-field full">
              <label htmlFor="ProductName">Product name <span>*</span></label>
              <input
                autoFocus
                id="ProductName"
                maxLength={200}
                name="ProductName"
                onChange={updateName}
                placeholder="e.g. Handwoven Wool Rug"
                aria-invalid={Boolean(fieldErrors.ProductName)}
                className={fieldErrors.ProductName ? 'field-invalid' : ''}
                value={values.ProductName}
              />
              {fieldErrors.ProductName && <span className="field-error">{fieldErrors.ProductName}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="CategoryId">Category <span>*</span></label>
              <select
                id="CategoryId"
                name="CategoryId"
                onChange={updateField}
                aria-invalid={Boolean(fieldErrors.CategoryId)}
                className={fieldErrors.CategoryId ? 'field-invalid' : ''}
                value={values.CategoryId}
              >
                <option value="">Select category</option>
                {categories.map((category, index) => {
                  const id = readProduct(category, 'categoryId', 'CategoryId', category?.id ?? category?.Id ?? index)
                  const name = readProduct(category, 'categoryName', 'CategoryName', 'Unnamed category')
                  return <option key={id} value={id}>{name}</option>
                })}
              </select>
              {fieldErrors.CategoryId && <span className="field-error">{fieldErrors.CategoryId}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="SKU">SKU</label>
              <input
                id="SKU"
                maxLength={60}
                name="SKU"
                onChange={updateField}
                placeholder="JC-RUG-001"
                aria-invalid={Boolean(fieldErrors.SKU)}
                className={fieldErrors.SKU ? 'field-invalid' : ''}
                value={values.SKU}
              />
              {fieldErrors.SKU && <span className="field-error">{fieldErrors.SKU}</span>}
            </div>

            <div className="form-field full">
              <label htmlFor="Slug">URL slug</label>
              <input
                id="Slug"
                maxLength={220}
                name="Slug"
                onChange={(event) => {
                  setSlugEdited(true)
                  updateField(event)
                }}
                placeholder="handwoven-wool-rug"
                aria-invalid={Boolean(fieldErrors.Slug)}
                className={fieldErrors.Slug ? 'field-invalid' : ''}
                value={values.Slug}
              />
              {fieldErrors.Slug && <span className="field-error">{fieldErrors.Slug}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="Price">India price (INR) <span>*</span></label>
              <input
                id="Price"
                name="Price"
                onChange={updateField}
                step="0.01"
                type="number"
                value={values.Price}
                aria-invalid={Boolean(fieldErrors.Price)}
                className={fieldErrors.Price ? 'field-invalid' : ''}
              />
              {fieldErrors.Price && <span className="field-error">{fieldErrors.Price}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="UsdPrice">International price (USD) <span>*</span></label>
              <input
                id="UsdPrice"
                min="0.01"
                name="UsdPrice"
                onChange={updateField}
                step="0.01"
                type="number"
                value={values.UsdPrice}
                aria-invalid={Boolean(fieldErrors.UsdPrice)}
                className={fieldErrors.UsdPrice ? 'field-invalid' : ''}
              />
              {fieldErrors.UsdPrice && <span className="field-error">{fieldErrors.UsdPrice}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="DiscountPrice">Discount price (INR)</label>
              <input
                id="DiscountPrice"
                name="DiscountPrice"
                onChange={updateField}
                step="0.01"
                type="number"
                value={values.DiscountPrice}
                aria-invalid={Boolean(fieldErrors.DiscountPrice)}
                className={fieldErrors.DiscountPrice ? 'field-invalid' : ''}
              />
              {fieldErrors.DiscountPrice && <span className="field-error">{fieldErrors.DiscountPrice}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="UsdDiscountPrice">Discount price (USD)</label>
              <input
                id="UsdDiscountPrice"
                min="0"
                name="UsdDiscountPrice"
                onChange={updateField}
                step="0.01"
                type="number"
                value={values.UsdDiscountPrice}
                aria-invalid={Boolean(fieldErrors.UsdDiscountPrice)}
                className={fieldErrors.UsdDiscountPrice ? 'field-invalid' : ''}
              />
              {fieldErrors.UsdDiscountPrice && <span className="field-error">{fieldErrors.UsdDiscountPrice}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="StockQuantity">Stock quantity</label>
              <input
                id="StockQuantity"
                name="StockQuantity"
                onChange={updateField}
                type="number"
                value={values.StockQuantity}
                aria-invalid={Boolean(fieldErrors.StockQuantity)}
                className={fieldErrors.StockQuantity ? 'field-invalid' : ''}
              />
              {fieldErrors.StockQuantity && <span className="field-error">{fieldErrors.StockQuantity}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="Material">Material</label>
              <input id="Material" maxLength={100} name="Material" onChange={updateField} placeholder="Wool, cotton..." value={values.Material} />
            </div>

            <div className="form-field">
              <label htmlFor="Size">Size</label>
              <input id="Size" maxLength={100} name="Size" onChange={updateField} placeholder="e.g. 5 x 8 ft" value={values.Size} />
            </div>

            <div className="form-field">
              <label htmlFor="Shape">Shape</label>
              <input id="Shape" maxLength={50} name="Shape" onChange={updateField} placeholder="Rectangle, round..." value={values.Shape} />
            </div>

            <div className="form-field">
              <label htmlFor="Color">Color</label>
              <input id="Color" maxLength={100} name="Color" onChange={updateField} placeholder="Ivory, sage..." value={values.Color} />
            </div>

            <div className="form-field">
              <label htmlFor="PileHeight">Pile height</label>
              <input id="PileHeight" maxLength={50} name="PileHeight" onChange={updateField} placeholder="e.g. 8 mm" value={values.PileHeight} />
            </div>

            <div className="form-field full">
              <label htmlFor="ShortDescription">Short description</label>
              <input id="ShortDescription" maxLength={500} name="ShortDescription" onChange={updateField} placeholder="A short product summary..." value={values.ShortDescription} />
            </div>

            <div className="form-field full">
              <label htmlFor="Description">Description</label>
              <textarea id="Description" name="Description" onChange={updateField} placeholder="Product details..." value={values.Description} />
            </div>

            <div className="form-field full">
              <label htmlFor="ManufacturingDetails">Manufacturing details</label>
              <textarea id="ManufacturingDetails" maxLength={500} name="ManufacturingDetails" onChange={updateField} placeholder="Craft and manufacturing information..." value={values.ManufacturingDetails} />
            </div>

            <label className="product-check">
              <input checked={Boolean(values.IsFeatured)} name="IsFeatured" onChange={updateField} type="checkbox" />
              Featured product
            </label>
            <label className="product-check">
              <input checked={Boolean(values.IsActive)} name="IsActive" onChange={updateField} type="checkbox" />
              Active in catalog
            </label>
          </div>

          {error && (
            <div className="inline-error modal-error" role="alert">
              <Icon name="warning" size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="modal-actions">
            <button className="secondary-button" disabled={saving} onClick={onClose} type="button">Cancel</button>
            <button className="primary-button" disabled={saving} type="submit">
              {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default ProductFormModal
