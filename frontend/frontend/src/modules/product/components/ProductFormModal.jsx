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
  }

  function updateName(event) {
    const ProductName = event.target.value
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

        <form className="category-form" onSubmit={submitForm}>
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
                required
                value={values.ProductName}
              />
            </div>

            <div className="form-field">
              <label htmlFor="CategoryId">Category <span>*</span></label>
              <select
                id="CategoryId"
                name="CategoryId"
                onChange={updateField}
                required
                value={values.CategoryId}
              >
                <option value="">Select category</option>
                {categories.map((category, index) => {
                  const id = readProduct(category, 'categoryId', 'CategoryId', category?.id ?? category?.Id ?? index)
                  const name = readProduct(category, 'categoryName', 'CategoryName', 'Unnamed category')
                  return <option key={id} value={id}>{name}</option>
                })}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="SKU">SKU <span>*</span></label>
              <input
                id="SKU"
                maxLength={60}
                name="SKU"
                onChange={updateField}
                placeholder="JC-RUG-001"
                required
                value={values.SKU}
              />
            </div>

            <div className="form-field full">
              <label htmlFor="Slug">URL slug <span>*</span></label>
              <input
                id="Slug"
                maxLength={220}
                name="Slug"
                onChange={(event) => {
                  setSlugEdited(true)
                  updateField(event)
                }}
                placeholder="handwoven-wool-rug"
                required
                value={values.Slug}
              />
            </div>

            <div className="form-field">
              <label htmlFor="Price">Price (₹) <span>*</span></label>
              <input
                id="Price"
                min="0.01"
                name="Price"
                onChange={updateField}
                required
                step="0.01"
                type="number"
                value={values.Price}
              />
            </div>

            <div className="form-field">
              <label htmlFor="DiscountPrice">Discount price (₹)</label>
              <input
                id="DiscountPrice"
                min="0"
                name="DiscountPrice"
                onChange={updateField}
                step="0.01"
                type="number"
                value={values.DiscountPrice}
              />
            </div>

            <div className="form-field">
              <label htmlFor="StockQuantity">Stock quantity</label>
              <input
                id="StockQuantity"
                min="0"
                name="StockQuantity"
                onChange={updateField}
                required
                type="number"
                value={values.StockQuantity}
              />
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
