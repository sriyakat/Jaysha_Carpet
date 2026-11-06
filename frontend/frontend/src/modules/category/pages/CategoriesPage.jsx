import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '../api/categoryApi.js'
import CategoryFormModal from '../components/CategoryFormModal.jsx'
import CategoryTable from '../components/CategoryTable.jsx'
import Icon from '../components/Icon.jsx'
import AdminModuleLayout from '../../shared/components/AdminModuleLayout.jsx'

const SUGGESTED_CARPET_CATEGORIES = [
  ['Persian Carpets', 'persian-carpets'],
  ['Oriental Carpets', 'oriental-carpets'],
  ['Traditional Carpets', 'traditional-carpets'],
  ['Modern Carpets', 'modern-carpets'],
  ['Geometric Carpets', 'geometric-carpets'],
  ['Floral Carpets', 'floral-carpets'],
  ['Abstract Carpets', 'abstract-carpets'],
  ['Handwoven Carpets', 'handwoven-carpets'],
  ['Wool Carpets', 'wool-carpets'],
  ['Cotton Carpets', 'cotton-carpets'],
  ['Silk Carpets', 'silk-carpets'],
  ['Jute Carpets', 'jute-carpets'],
  ['Dhurries', 'dhurries'],
  ['Kilim Carpets', 'kilim-carpets'],
  ['Shaggy Carpets', 'shaggy-carpets'],
  ['Carpet Runners', 'carpet-runners'],
  ['Round Carpets', 'round-carpets'],
  ['Outdoor Carpets', 'outdoor-carpets'],
  ['Kids Carpets', 'kids-carpets'],
  ['Prayer Carpets', 'prayer-carpets'],
  ['Bath Mats', 'bath-mats'],
]

function categoryId(category) {
  return category?.categoryId ?? category?.CategoryId ?? category?.id ?? category?.Id
}

function CategoriesPage({ user, onLogout, onNavigate }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [search, setSearch] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [addingSuggested, setAddingSuggested] = useState(false)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    setListError('')

    try {
      setCategories(await getCategories())
      return true
    } catch (error) {
      setListError(error.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    getCategories()
      .then((items) => {
        if (active) setCategories(items)
      })
      .catch((error) => {
        if (active) setListError(error.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const visibleCategories = useMemo(() => {
    const query = search.trim().toLowerCase()
    return [...categories]
      .sort((a, b) => {
        const orderA = Number(a?.displayOrder ?? a?.DisplayOrder ?? 0)
        const orderB = Number(b?.displayOrder ?? b?.DisplayOrder ?? 0)
        return orderA - orderB
      })
      .filter((category) => {
        const name = category?.categoryName ?? category?.CategoryName ?? ''
        const slug = category?.slug ?? category?.Slug ?? ''
        const description = category?.description ?? category?.Description ?? ''
        return `${name} ${slug} ${description}`.toLowerCase().includes(query)
      })
  }, [categories, search])

  function openCreateForm() {
    setFormError('')
    setActionError('')
    setEditingCategory(null)
    setIsAdding(true)
  }

  function openEditForm(category) {
    setFormError('')
    setActionError('')
    setIsAdding(false)
    setEditingCategory(category)
  }

  function closeForm() {
    if (saving) return
    setIsAdding(false)
    setEditingCategory(null)
    setFormError('')
  }

  async function saveCategory(values) {
    const categoryName = values.get('categoryName')?.trim().toLocaleLowerCase()
    const slug = values.get('slug')?.trim().toLocaleLowerCase()
    const duplicate = categories.some((category) => (
      categoryId(category) !== categoryId(editingCategory)
      && (
        String(category.categoryName ?? category.CategoryName ?? '').trim().toLocaleLowerCase() === categoryName
        || String(category.slug ?? category.Slug ?? '').trim().toLocaleLowerCase() === slug
      )
    ))
    if (duplicate) {
      setFormError('यह श्रेणी या इसका URL नाम पहले से मौजूद है। कृपया अलग नाम या URL नाम दर्ज करें।')
      return
    }

    setSaving(true)
    setFormError('')

    try {
      if (editingCategory) {
        await updateCategory(categoryId(editingCategory), values)
      } else {
        await createCategory(values)
      }

      setIsAdding(false)
      setEditingCategory(null)
      await loadCategories()
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function addSuggestedCategories() {
    const existingSlugs = new Set(categories.map((category) => (
      String(category.slug ?? category.Slug ?? '').trim().toLowerCase()
    )))
    const existingNames = new Set(categories.map((category) => (
      String(category.categoryName ?? category.CategoryName ?? '').trim().toLowerCase()
    )))
    const missing = SUGGESTED_CARPET_CATEGORIES.filter(([name, slug]) => (
      !existingSlugs.has(slug) && !existingNames.has(name.toLowerCase())
    ))
    if (!missing.length) {
      setActionSuccess('')
      setActionError('कार्पेट की सभी सुझाई गई श्रेणियाँ पहले से मौजूद हैं।')
      return
    }

    setAddingSuggested(true)
    setActionError('')
    setActionSuccess('')
    const failed = []
    try {
      for (const [categoryName, slug] of missing) {
        const formData = new FormData()
        formData.append('categoryName', categoryName)
        formData.append('slug', slug)
        formData.append('description', `${categoryName} collection`)
        formData.append('displayOrder', String(SUGGESTED_CARPET_CATEGORIES.findIndex((item) => item[1] === slug)))
        try {
          await createCategory(formData)
        } catch (error) {
          failed.push(`${categoryName}: ${error.message}`)
        }
      }

      const loaded = await loadCategories()
      if (!loaded) throw new Error('सूची रीफ़्रेश नहीं हो सकी।')
      if (failed.length) {
        setActionError(`कुछ श्रेणियाँ नहीं जुड़ सकीं: ${failed.join(' · ')}`)
      } else {
        setActionSuccess(`${missing.length} कार्पेट श्रेणियाँ सफलतापूर्वक जोड़ दी गईं।`)
      }
    } catch (error) {
      setActionError(`श्रेणियाँ पूरी नहीं हो सकीं: ${error.message}`)
    } finally {
      setAddingSuggested(false)
    }
  }

  async function removeCategory(category) {
    const name = category?.categoryName ?? category?.CategoryName ?? 'यह श्रेणी'
    const id = categoryId(category)

    if (id === undefined || id === null) {
      setActionError('श्रेणी की जानकारी नहीं मिली, इसलिए इसे हटाया नहीं जा सकता।')
      return
    }

    if (!window.confirm(`"${name}" ko delete karna chahte hain?`)) return

    setActionError('')
    setActionSuccess('')

    try {
      await deleteCategory(id)
      await loadCategories()
    } catch (error) {
      setActionError(`श्रेणी हटाई नहीं जा सकी: ${error.message}`)
    }
  }

  const selectedCategory = editingCategory || (isAdding ? null : undefined)

  return (
    <AdminModuleLayout activeModule="categories" title="Categories" user={user} onLogout={onLogout} onNavigate={onNavigate}>
        <div className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow"><span className="eyebrow-dot" /> Product catalog</p>
              <h1>Categories</h1>
              <p>Apne carpet collections ko organize aur manage karein.</p>
            </div>
            <div className="category-heading-actions">
              <button className="secondary-button" disabled={addingSuggested || loading} onClick={addSuggestedCategories} type="button">
                {addingSuggested ? 'श्रेणियाँ जोड़ी जा रही हैं…' : 'कार्पेट श्रेणियाँ जोड़ें'}
              </button>
              <button className="primary-button" onClick={openCreateForm} type="button">
                <Icon name="plus" size={17} />
                Add category
              </button>
            </div>
            <div aria-hidden="true" className="hero-ornament">
              <span className="ornament-ring ring-one" />
              <span className="ornament-ring ring-two" />
              <span className="ornament-center"><Icon name="category" size={30} /></span>
            </div>
          </div>

          {actionError && (
            <div className="page-error" role="alert">
              <Icon name="warning" size={17} />
              <span>{actionError}</span>
            </div>
          )}
          {actionSuccess && <div className="page-success" role="status">{actionSuccess}</div>}

          <div className="overview-grid">
            <article className="overview-card">
              <span className="overview-icon"><Icon name="category" size={20} /></span>
              <div>
                <p className="overview-label">Total categories</p>
                <p className="overview-value">{loading ? '—' : categories.length}</p>
              </div>
            </article>
            <article className="overview-card">
              <span className="overview-icon"><Icon name="box" size={20} /></span>
              <div>
                <p className="overview-label">Visible in this list</p>
                <p className="overview-value">{loading ? '—' : visibleCategories.length}</p>
              </div>
            </article>
            <article className="overview-card">
              <span className="overview-icon"><Icon name="sparkle" size={20} /></span>
              <div>
                <p className="overview-label">Catalog status</p>
                <p className="overview-value">{listError ? 'Offline' : loading ? 'Loading' : 'Connected'}</p>
              </div>
            </article>
          </div>

          <CategoryTable
            categories={visibleCategories}
            error={listError}
            loading={loading}
            onAdd={openCreateForm}
            onDelete={removeCategory}
            onEdit={openEditForm}
            onSearch={setSearch}
            search={search}
          />
        </div>

      {isAdding && (
        <CategoryFormModal
          error={formError}
          onClose={closeForm}
          onSubmit={saveCategory}
          saving={saving}
        />
      )}
      {editingCategory && (
        <CategoryFormModal
          category={selectedCategory}
          error={formError}
          onClose={closeForm}
          onSubmit={saveCategory}
          saving={saving}
        />
      )}
    </AdminModuleLayout>
  )
}

export default CategoriesPage
