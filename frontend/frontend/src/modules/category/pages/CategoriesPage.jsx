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
import AdminNavigation from '../../shared/components/AdminNavigation.jsx'

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

  const loadCategories = useCallback(async () => {
    setLoading(true)
    setListError('')

    try {
      setCategories(await getCategories())
    } catch (error) {
      setListError(error.message)
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

  async function removeCategory(category) {
    const name = category?.categoryName ?? category?.CategoryName ?? 'this category'
    const id = categoryId(category)

    if (id === undefined || id === null) {
      setActionError('Is category ka ID nahi mila, isliye ise delete nahi kiya ja sakta.')
      return
    }

    if (!window.confirm(`"${name}" ko delete karna chahte hain?`)) return

    setActionError('')

    try {
      await deleteCategory(id)
      await loadCategories()
    } catch (error) {
      setActionError(error.message)
    }
  }

  const selectedCategory = editingCategory || (isAdding ? null : undefined)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a aria-label="Jaysha Carpet admin home" className="brand" href="/admin">
          <span className="brand-mark"><Icon name="grid" size={20} /></span>
          <span>
            <span className="brand-name">Jaysha Carpet</span>
            <span className="brand-caption">STORE ADMIN</span>
          </span>
        </a>

        <AdminNavigation activeModule="categories" onNavigate={onNavigate} />

        <div className="sidebar-spacer" />
        <div className="sidebar-note">
          <h2 className="sidebar-note-title">Keep your catalog tidy</h2>
          <p>Clear categories help customers find the right carpet faster.</p>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <Icon name="arrow" size={13} />
            <strong>Categories</strong>
          </div>
          <div className="topbar-right">
            <span className="topbar-date">Catalog management</span>
            <span aria-label={user?.fullName || 'Jaysha Carpet admin'} className="avatar">
              {(user?.fullName || 'JC').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
            </span>
            <button className="logout-button" onClick={onLogout} type="button">Sign out</button>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow"><span className="eyebrow-dot" /> Product catalog</p>
              <h1>Categories</h1>
              <p>Apne carpet collections ko organize aur manage karein.</p>
            </div>
            <button className="primary-button" onClick={openCreateForm} type="button">
              <Icon name="plus" size={17} />
              Add category
            </button>
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
      </main>

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
    </div>
  )
}

export default CategoriesPage
