import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminModuleLayout from '../../shared/components/AdminModuleLayout.jsx'
import { getProductImageUrl } from '../../product/api/productApi.js'
import { createBlogPost, deleteBlogPost, getBlogPosts, updateBlogPost } from '../api/blogApi.js'
import '../../shared/components/AdminModulePage.css'
import './BlogPage.css'

const EMPTY_FORM = {
  title: '',
  category: '',
  excerpt: '',
  body: '',
  imageAlt: '',
  mediaType: 'image',
  displayOrder: 0,
  isActive: true,
}

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/ogg'])
const MAX_FILE_SIZE = 100 * 1024 * 1024
const PAGE_SIZE = 20

function BlogPage({ user, onLogout, onNavigate }) {
  const [posts, setPosts] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 0 })
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(EMPTY_FORM)
  const [mediaFile, setMediaFile] = useState(null)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const previewUrl = useMemo(() => mediaFile ? URL.createObjectURL(mediaFile) : '', [mediaFile])

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getBlogPosts({ admin: true, page, pageSize: PAGE_SIZE })
      const lastPage = Math.max(1, result.pagination.totalPages)
      if (page > lastPage) {
        setPage(lastPage)
        return
      }
      setPosts(result.items)
      setPagination(result.pagination)
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { load() }, [load])

  function startCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM, displayOrder: pagination.total })
    setMediaFile(null)
    setFormError('')
    setShowForm(true)
  }

  function startEdit(post) {
    setEditing(post)
    setForm({
      title: post.title,
      category: post.category,
      excerpt: post.excerpt,
      body: post.body,
      imageAlt: post.imageAlt || '',
      mediaType: post.mediaType,
      displayOrder: post.displayOrder,
      isActive: post.isActive,
    })
    setMediaFile(null)
    setFormError('')
    setShowForm(true)
  }

  function chooseMedia(file) {
    if (!file) return
    const allowedTypes = form.mediaType === 'video' ? VIDEO_TYPES : IMAGE_TYPES
    if (!allowedTypes.has(file.type)) {
      setFormError(form.mediaType === 'video'
        ? 'MP4, WebM ya OGG video select karein.'
        : 'JPEG, PNG, WebP ya GIF image select karein.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setFormError('Media file 100 MB ya usse chhoti honi chahiye.')
      return
    }
    setFormError('')
    setMediaFile(file)
  }

  async function submit(event) {
    event.preventDefault()
    if (!editing && !mediaFile) {
      setFormError('Blog post ke liye image ya video select karein.')
      return
    }
    if (editing && form.mediaType !== editing.mediaType && !mediaFile) {
      setFormError('Media type badalne ke liye nayi file upload karein.')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const values = { ...form, displayOrder: Number(form.displayOrder) }
      if (editing) await updateBlogPost(editing.id, values, mediaFile)
      else await createBlogPost(values, mediaFile)
      setShowForm(false)
      await load()
    } catch (saveError) {
      setFormError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(post) {
    if (!window.confirm(`Delete "${post.title}" from the journal?`)) return
    try {
      await deleteBlogPost(post.id)
      await load()
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  return (
    <AdminModuleLayout activeModule="blog" title="Blog & journal" user={user} onLogout={onLogout} onNavigate={onNavigate}>
      <section className="page-content module-page">
        <div className="module-heading">
          <div><p className="module-eyebrow">STOREFRONT CONTENT</p><h1>Blog & journal</h1><p>Write articles, upload images or videos, and choose which stories appear on the shop.</p></div>
          <button className="module-button primary" onClick={startCreate} type="button">Write a blog</button>
        </div>
        {error && <p className="module-alert" role="alert">{error}</p>}
        {showForm && <section className="module-form-panel blog-form-panel">
          <h2>{editing ? 'Edit blog post' : 'Write a blog post'}</h2>
          {formError && <p className="module-alert" role="alert">{formError}</p>}
          <form className="module-form" onSubmit={submit}>
            <label className="module-field">Title<input className="module-input" maxLength="120" onChange={(event) => setForm({ ...form, title: event.target.value })} required value={form.title} /></label>
            <label className="module-field">Category<input className="module-input" maxLength="60" onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="e.g. THE ART OF LAYERING" required value={form.category} /></label>
            <label className="module-field wide">Short description<input className="module-input" maxLength="250" onChange={(event) => setForm({ ...form, excerpt: event.target.value })} required value={form.excerpt} /></label>
            <label className="module-field wide">Article text<textarea className="module-textarea blog-body-input" maxLength="100000" onChange={(event) => setForm({ ...form, body: event.target.value })} placeholder="Write the full article here. Use a blank line to start a new paragraph." required value={form.body} /></label>
            <label className="module-field">Media type<select className="module-select" onChange={(event) => { setForm({ ...form, mediaType: event.target.value }); setMediaFile(null); setFormError('') }} value={form.mediaType}><option value="image">Image</option><option value="video">Video</option></select></label>
            <label className="module-field">Display order<input className="module-input" min="0" onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} required type="number" value={form.displayOrder} /></label>
            <label className="module-field wide">Upload {form.mediaType}<input accept={form.mediaType === 'video' ? 'video/mp4,video/webm,video/ogg' : 'image/jpeg,image/png,image/webp,image/gif'} className="module-input" onChange={(event) => { chooseMedia(event.target.files?.[0]); event.target.value = '' }} type="file" />{editing && !mediaFile && <span>Current {editing.mediaType} will stay unless a new file is selected.</span>}<span>Images: JPEG, PNG, WebP, GIF · Videos: MP4, WebM, OGG · Maximum 100 MB</span></label>
            <label className="module-field wide">Image description (optional)<input className="module-input" maxLength="200" onChange={(event) => setForm({ ...form, imageAlt: event.target.value })} value={form.imageAlt} /></label>
            {(previewUrl || (editing && form.mediaType === editing.mediaType)) && <div className="blog-media-preview wide">{form.mediaType === 'video'
              ? <video controls playsInline src={previewUrl || getProductImageUrl(editing.mediaUrl)} />
              : <img alt="Blog media preview" src={previewUrl || getProductImageUrl(editing.mediaUrl)} />}</div>}
            <label className="module-checkbox wide"><input checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} type="checkbox" /> Publish this article on the shop</label>
            <div className="module-form-actions"><button className="module-button" disabled={saving} onClick={() => setShowForm(false)} type="button">Cancel</button><button className="module-button primary" disabled={saving} type="submit">{saving ? 'Saving…' : editing ? 'Save changes' : 'Publish blog'}</button></div>
          </form>
        </section>}
        <section className="module-panel">
          <div className="module-panel-heading"><div><h2>Journal articles</h2><span>{pagination.total} total</span></div><button className="module-button" onClick={load} type="button">Refresh</button></div>
          {loading ? <div className="module-state">Loading journal articles…</div> : posts.length === 0 ? <div className="module-state">No blog posts yet. Write one to add it to the shop journal.</div> : <div className="blog-admin-grid">
            {posts.map((post) => <article className="blog-admin-card" key={post.id}>
              {post.mediaType === 'video'
                ? <video className="blog-admin-media" muted playsInline preload="metadata" src={getProductImageUrl(post.mediaUrl)} />
                : <img alt={post.imageAlt || ''} className="blog-admin-media" loading="lazy" src={getProductImageUrl(post.mediaUrl)} />}
              <div className="blog-admin-copy"><small>{post.category} · ORDER {post.displayOrder}</small><strong>{post.title}</strong><span>{post.excerpt}</span><span>{post.mediaType} · {post.isActive ? 'Published' : 'Hidden'}</span></div>
              <div className="module-row-actions"><button className="module-button" onClick={() => startEdit(post)} type="button">Edit</button><button className="module-button danger" onClick={() => remove(post)} type="button">Delete</button></div>
            </article>)}
          </div>}
          {pagination.totalPages > 1 && <div className="blog-pagination">
            <button className="module-button" disabled={loading || page <= 1} onClick={() => setPage((current) => current - 1)} type="button">Previous</button>
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <button className="module-button" disabled={loading || page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} type="button">Next</button>
          </div>}
        </section>
      </section>
    </AdminModuleLayout>
  )
}

export default BlogPage
