import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import ImageUploadField from '../../shared/components/ImageUploadField.jsx'

function toFormValues(category) {
  return {
    categoryName: category?.categoryName ?? category?.CategoryName ?? '',
    slug: category?.slug ?? category?.Slug ?? '',
    description: category?.description ?? category?.Description ?? '',
    imageStorageKey: category?.imageStorageKey ?? category?.ImageStorageKey ?? '',
    displayOrder: category?.displayOrder ?? category?.DisplayOrder ?? 0,
  }
}

function CategoryFormModal({ category, saving, error, onClose, onSubmit }) {
  const [values, setValues] = useState(() => toFormValues(category))
  const [fieldErrors, setFieldErrors] = useState({})
  const [selectedImage, setSelectedImage] = useState(null)
  const [slugEdited, setSlugEdited] = useState(Boolean(category))
  const isEditing = Boolean(category)

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !saving) onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, saving])

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
  }

  function updateName(event) {
    const categoryName = event.target.value
    setFieldErrors((current) => ({ ...current, categoryName: '' }))
    setValues((current) => ({
      ...current,
      categoryName,
      ...(!slugEdited
        ? { slug: categoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
        : {}),
    }))
  }

  function submitForm(event) {
    event.preventDefault()
    const errors = {}
    if (!values.categoryName.trim()) errors.categoryName = 'श्रेणी का नाम दर्ज करें।'
    if (!values.slug.trim()) errors.slug = 'श्रेणी का URL नाम दर्ज करें।'
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug.trim().toLowerCase())) {
      errors.slug = 'URL नाम में केवल छोटे अंग्रेज़ी अक्षर, अंक और हाइफ़न इस्तेमाल करें।'
    }
    if (!Number.isInteger(Number(values.displayOrder)) || Number(values.displayOrder) < 0) {
      errors.displayOrder = 'क्रमांक शून्य या उससे बड़ी पूर्ण संख्या होनी चाहिए।'
    }
    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors)
      return
    }

    const formData = new FormData()
    formData.append('categoryName', values.categoryName.trim())
    formData.append('slug', values.slug.trim().toLowerCase())
    formData.append('description', values.description.trim())
    formData.append('imageStorageKey', values.imageStorageKey)
    formData.append('displayOrder', String(Number(values.displayOrder)))
    if (selectedImage) formData.append('image', selectedImage)
    onSubmit(formData)
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose()
      }}
    >
      <section
        aria-labelledby="category-modal-title"
        aria-modal="true"
        className="modal"
        role="dialog"
      >
        <header className="modal-header">
          <div>
            <h2 id="category-modal-title">{isEditing ? 'Edit category' : 'Add a category'}</h2>
            <p>{isEditing ? 'Category details update karein.' : 'Nayi product category ki details enter karein.'}</p>
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
              <label htmlFor="categoryName">Category name <span>*</span></label>
              <input
                autoFocus
                id="categoryName"
                maxLength={150}
                name="categoryName"
                onChange={updateName}
                placeholder="e.g. Handwoven Rugs"
                aria-invalid={Boolean(fieldErrors.categoryName)}
                className={fieldErrors.categoryName ? 'field-invalid' : ''}
                value={values.categoryName}
              />
              {fieldErrors.categoryName && <span className="field-error">{fieldErrors.categoryName}</span>}
            </div>

            <div className="form-field full">
              <label htmlFor="slug">URL slug <span>*</span></label>
              <input
                id="slug"
                maxLength={180}
                name="slug"
                onChange={(event) => {
                  setSlugEdited(true)
                  updateField(event)
                }}
                placeholder="handwoven-rugs"
                aria-invalid={Boolean(fieldErrors.slug)}
                className={fieldErrors.slug ? 'field-invalid' : ''}
                value={values.slug}
              />
              <span className="form-hint">Link mein use hone wala unique naam.</span>
              {fieldErrors.slug && <span className="field-error">{fieldErrors.slug}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="displayOrder">Display order</label>
              <input
                id="displayOrder"
                min="0"
                name="displayOrder"
                onChange={updateField}
                type="number"
                value={values.displayOrder}
                aria-invalid={Boolean(fieldErrors.displayOrder)}
                className={fieldErrors.displayOrder ? 'field-invalid' : ''}
              />
              {fieldErrors.displayOrder && <span className="field-error">{fieldErrors.displayOrder}</span>}
            </div>

            <div className="form-field full">
              <label htmlFor="categoryImage">Category image</label>
              <ImageUploadField
                file={selectedImage}
                hint="JPEG, PNG, WebP ya GIF · Maximum 15 MB"
                id="categoryImage"
                label="Category image"
                onClear={() => {
                  setSelectedImage(null)
                  setValues((current) => ({ ...current, imageStorageKey: '' }))
                }}
                onFileChange={setSelectedImage}
                value={values.imageStorageKey}
              />
            </div>

            <div className="form-field full">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                onChange={updateField}
                placeholder="Is category ke baare mein chhota sa description..."
                value={values.description}
              />
            </div>
          </div>

          {error && (
            <div className="inline-error modal-error" role="alert">
              <Icon name="warning" size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="modal-actions">
            <button className="secondary-button" disabled={saving} onClick={onClose} type="button">
              Cancel
            </button>
            <button className="primary-button" disabled={saving} type="submit">
              {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create category'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default CategoryFormModal
