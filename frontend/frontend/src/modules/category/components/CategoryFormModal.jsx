import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'

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
  }

  function updateName(event) {
    const categoryName = event.target.value
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
    onSubmit({
      categoryName: values.categoryName.trim(),
      slug: values.slug.trim().toLowerCase(),
      description: values.description.trim() || null,
      imageStorageKey: values.imageStorageKey.trim() || null,
      displayOrder: Number(values.displayOrder),
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

        <form className="category-form" onSubmit={submitForm}>
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
                required
                value={values.categoryName}
              />
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
                required
                value={values.slug}
              />
              <span className="form-hint">Link mein use hone wala unique naam.</span>
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
              />
            </div>

            <div className="form-field">
              <label htmlFor="imageStorageKey">Image storage key</label>
              <input
                id="imageStorageKey"
                maxLength={500}
                name="imageStorageKey"
                onChange={updateField}
                placeholder="categories/rugs.jpg"
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
