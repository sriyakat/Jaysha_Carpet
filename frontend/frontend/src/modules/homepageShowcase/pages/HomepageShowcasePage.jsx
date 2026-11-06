import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminModuleLayout from '../../shared/components/AdminModuleLayout.jsx'
import { getProductImageUrl } from '../../product/api/productApi.js'
import { createHomepageShowcaseItem, deleteHomepageShowcaseItem, getHomepageShowcaseItems, updateHomepageShowcaseItem } from '../api/homepageShowcaseApi.js'
import '../shared/HomepageShowcasePage.css'
import '../../shared/components/AdminModulePage.css'

const EMPTY_FORM = {
  title: '',
  eyebrow: '',
  caption: '',
  buttonText: '',
  buttonUrl: '',
  mediaType: 'image',
  displayOrder: 0,
  isActive: true,
}

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/ogg'])
const MAX_FILE_SIZE = 100 * 1024 * 1024

function HomepageShowcasePage({ user, onLogout, onNavigate, section = 'showcase' }) {
  const isInspiration = section === 'inspiration'
  const isOffer = section === 'offer'
  const pageTitle = isOffer ? 'Homepage offer' : isInspiration ? 'Homepage inspiration' : 'Homepage showcase'
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ ...EMPTY_FORM, caption: '' })
  const [mediaFile, setMediaFile] = useState(null)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    let active = true
    getHomepageShowcaseItems({ admin: true, section })
      .then((loadedItems) => {
        if (active) {
          setError('')
          setItems(loadedItems)
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [section])

  const load = useCallback(async () => {
    try {
      const loadedItems = await getHomepageShowcaseItems({ admin: true, section })
      setError('')
      setItems(loadedItems)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [section])

  const previewUrl = useMemo(() => mediaFile ? URL.createObjectURL(mediaFile) : '', [mediaFile])

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  function startCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM, displayOrder: items.length })
    setMediaFile(null)
    setFormError('')
    setShowForm(true)
  }

  function startEdit(item) {
    setEditing(item)
    setForm({
      title: item.title,
      eyebrow: item.eyebrow || '',
      caption: item.caption || '',
      buttonText: item.buttonText || '',
      buttonUrl: item.buttonUrl || '',
      mediaType: item.mediaType,
      displayOrder: item.displayOrder,
      isActive: item.isActive,
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
      setFormError(`${isOffer ? 'Offer banner' : 'Homepage card'} ke liye image ya video select karein.`)
      return
    }
    if (editing && form.mediaType !== editing.mediaType && !mediaFile) {
      setFormError('Media type badalne ke liye nayi file upload karein.')
      return
    }
    if (mediaFile && !(form.mediaType === 'video' ? VIDEO_TYPES : IMAGE_TYPES).has(mediaFile.type)) {
      setFormError('Naye media file ka format selected media type se match nahi karta.')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const values = { ...form, displayOrder: Number(form.displayOrder) }
      if (editing) await updateHomepageShowcaseItem(editing.id, values, mediaFile, section)
      else await createHomepageShowcaseItem(values, mediaFile, section)
      setShowForm(false)
      await load()
    } catch (saveError) {
      setFormError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(item) {
    if (!window.confirm(`Delete "${item.title}" from ${pageTitle.toLowerCase()}?`)) return
    setError('')
    try {
      await deleteHomepageShowcaseItem(item.id, section)
      await load()
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  return (
    <AdminModuleLayout activeModule={section} title={pageTitle} user={user} onLogout={onLogout} onNavigate={onNavigate}>
      <section className="page-content module-page">
        <div className="module-heading">
          <div><p className="module-eyebrow">STOREFRONT CONTENT</p><h1>{pageTitle}</h1><p>{isOffer ? 'Create a full-width homepage promotion like the offer banner shown in the storefront design.' : isInspiration ? 'Add and arrange the image or video cards shown in “Collected for considered homes”.' : 'Add and arrange the image or video cards shown in “Find your kind of comfort”.'}</p></div>
          <button className="module-button primary" onClick={startCreate} type="button">{isOffer ? 'Add offer' : 'Add card'}</button>
        </div>
        {isOffer && <p className="module-state">Only the active offer with the lowest display order appears in the homepage banner. Use real offer terms and link the button to the relevant products or offer page.</p>}
        {error && <p className="module-alert" role="alert">{error}</p>}
        {showForm && <section className="module-form-panel">
          <h2>{editing ? `Edit ${isOffer ? 'offer' : 'showcase card'}` : `Add ${isOffer ? 'offer' : 'showcase card'}`}</h2>
          {formError && <p className="module-alert" role="alert">{formError}</p>}
          <form className="module-form" onSubmit={submit}>
            <label className="module-field">Title<input className="module-input" maxLength="120" onChange={(event) => setForm({ ...form, title: event.target.value })} required value={form.title} /></label>
            {isInspiration
              ? <label className="module-field">Caption<input className="module-input" maxLength="200" onChange={(event) => setForm({ ...form, caption: event.target.value })} value={form.caption} /></label>
              : <label className="module-field">Eyebrow (optional)<input className="module-input" maxLength="60" onChange={(event) => setForm({ ...form, eyebrow: event.target.value })} value={form.eyebrow} /></label>}
            {isOffer && <>
              <label className="module-field">Supporting text<input className="module-input" maxLength="200" onChange={(event) => setForm({ ...form, caption: event.target.value })} value={form.caption} /></label>
              <label className="module-field">Button text<input className="module-input" maxLength="50" onChange={(event) => setForm({ ...form, buttonText: event.target.value })} required value={form.buttonText} /></label>
              <label className="module-field wide">Button link<input className="module-input" maxLength="500" onChange={(event) => setForm({ ...form, buttonUrl: event.target.value })} placeholder="/#shop-products" required value={form.buttonUrl} /></label>
            </>}
            <label className="module-field">Media type<select className="module-select" onChange={(event) => { setForm({ ...form, mediaType: event.target.value }); setMediaFile(null); setFormError('') }} value={form.mediaType}><option value="image">Image</option><option value="video">Video</option></select></label>
            <label className="module-field">Display order<input className="module-input" min="0" onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} required type="number" value={form.displayOrder} /></label>
            <label className="module-field wide">Upload {form.mediaType}<input accept={form.mediaType === 'video' ? 'video/mp4,video/webm,video/ogg' : 'image/jpeg,image/png,image/webp,image/gif'} className="module-input showcase-media-input" onChange={(event) => { chooseMedia(event.target.files?.[0]); event.target.value = '' }} type="file" />{editing && !mediaFile && <span>Current {editing.mediaType} will stay unless a new file is selected.</span>}<span>Images: JPEG, PNG, WebP, GIF · Videos: MP4, WebM, OGG · Maximum 100 MB</span></label>
            {(previewUrl || (editing && form.mediaType === editing.mediaType)) && <div className="showcase-media-preview wide">{form.mediaType === 'video'
              ? <video controls muted playsInline src={previewUrl || getProductImageUrl(editing.mediaUrl)} />
              : <img alt="Showcase media preview" src={previewUrl || getProductImageUrl(editing.mediaUrl)} />}</div>}
            <label className="module-checkbox wide"><input checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} type="checkbox" /> Show this card on the homepage</label>
            <div className="module-form-actions"><button className="module-button" onClick={() => setShowForm(false)} type="button">Cancel</button><button className="module-button primary" disabled={saving} type="submit">{saving ? 'Saving…' : editing ? 'Save changes' : 'Add card'}</button></div>
          </form>
        </section>}
        <section className="module-panel">
          <div className="module-panel-heading"><h2>{isOffer ? 'Offers' : 'Showcase cards'}</h2><button className="module-button" onClick={load} type="button">Refresh</button></div>
          {loading ? <div className="module-state">Loading {pageTitle.toLowerCase()}…</div> : items.length === 0 ? <div className="module-state">No {isOffer ? 'offers' : 'showcase cards'} yet. Add one to display it on the homepage.</div> : <div className="showcase-admin-grid">
            {items.map((item) => <article className="showcase-admin-card" key={item.id}>
              {item.mediaType === 'video'
                ? <video className="showcase-admin-media" muted playsInline preload="metadata" src={getProductImageUrl(item.mediaUrl)} />
                : <img alt="" className="showcase-admin-media" loading="lazy" src={getProductImageUrl(item.mediaUrl)} />}
              <div className="showcase-admin-copy">{isInspiration ? <small>ORDER {item.displayOrder}</small> : <small>{item.eyebrow || 'NO EYEBROW'} · ORDER {item.displayOrder}</small>}<strong>{item.title}</strong>{(isInspiration || isOffer) && item.caption && <span>{item.caption}</span>}{isOffer && <span>{item.buttonText} → {item.buttonUrl}</span>}<span>{item.mediaType} · {item.isActive ? 'Visible' : 'Hidden'}</span></div>
              <div className="module-row-actions"><button className="module-button" onClick={() => startEdit(item)} type="button">Edit</button><button className="module-button danger" onClick={() => remove(item)} type="button">Delete</button></div>
            </article>)}
          </div>}
        </section>
      </section>
    </AdminModuleLayout>
  )
}

export default HomepageShowcasePage
