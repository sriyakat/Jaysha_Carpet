import { useCallback, useEffect, useState } from 'react'
import { getProducts } from '../../product/api/productApi.js'
import AdminModuleLayout from '../../shared/components/AdminModuleLayout.jsx'
import '../shared/AdminModulePage.css'
import { createProductVideo, deleteProductVideo, getAdminProductVideos, updateProductVideo } from '../api/adminProductVideoApi.js'

function value(item, camel, pascal, fallback = '') {
  return item?.[camel] ?? item?.[pascal] ?? fallback
}

function isEnabled(valueToCheck) {
  return valueToCheck === true || valueToCheck === 1 || valueToCheck === '1' || valueToCheck === 'true'
}

const emptyForm = { ProductId: '', StorageKey: '', OriginalFileName: '', FileType: 'video/mp4', FileSize: '', IsIllustrativePreview: false }

function ProductVideosPage({ user, onLogout, onNavigate }) {
  const [videos, setVideos] = useState([])
  const [products, setProducts] = useState([])
  const [productFilter, setProductFilter] = useState('')
  const [previewFilter, setPreviewFilter] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [selectedFile, setSelectedFile] = useState(null)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const items = await getAdminProductVideos({ productId: productFilter, isIllustrativePreview: previewFilter })
      setVideos(items)
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [productFilter, previewFilter])

  useEffect(() => {
    let active = true
    getAdminProductVideos({ productId: productFilter, isIllustrativePreview: previewFilter })
      .then((items) => {
        if (active) {
          setVideos(items)
          setError('')
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [productFilter, previewFilter])
  useEffect(() => {
    let active = true
    getProducts().then((items) => {
      if (active) setProducts(items)
    }).catch((loadError) => {
      if (active) setError(`Products load nahi ho sake: ${loadError.message}`)
    })
    return () => { active = false }
  }, [])

  function startCreate() {
    setEditing(null)
    setForm({ ...emptyForm, ProductId: productFilter || String(value(products[0], 'productId', 'ProductId', '')) })
    setSelectedFile(null)
    setFormError('')
    setShowForm(true)
  }

  function startEdit(video) {
    setEditing(video)
    setSelectedFile(null)
    setForm({
      ProductId: String(value(video, 'productId', 'ProductId')),
      StorageKey: value(video, 'storageKey', 'StorageKey'),
      OriginalFileName: value(video, 'originalFileName', 'OriginalFileName'),
      FileType: value(video, 'fileType', 'FileType'),
      FileSize: String(value(video, 'fileSize', 'FileSize')),
      IsIllustrativePreview: isEnabled(value(video, 'isIllustrativePreview', 'IsIllustrativePreview', false)),
    })
    setFormError('')
    setShowForm(true)
  }

  async function submit(event) {
    event.preventDefault()
    if (!editing && !selectedFile) {
      setFormError('Apni gallery se video select karein.')
      return
    }
    if (selectedFile && selectedFile.size > 100 * 1024 * 1024) {
      setFormError('Video size 100 MB ya usse kam honi chahiye.')
      return
    }
    if (selectedFile && !['video/mp4', 'video/webm', 'video/ogg'].includes(selectedFile.type)) {
      setFormError('Sirf MP4, WebM ya OGG video select karein.')
      return
    }

    setSaving(true)
    setFormError('')
    let data = { ...form, ProductId: Number(form.ProductId), FileSize: Number(form.FileSize) }
    if (selectedFile) {
      data = new FormData()
      data.append('ProductId', form.ProductId)
      data.append('IsIllustrativePreview', String(form.IsIllustrativePreview))
      data.append('video', selectedFile)
    }
    try {
      if (editing) await updateProductVideo(value(editing, 'productVideoId', 'ProductVideoId'), data)
      else await createProductVideo(data)
      setShowForm(false)
      await load()
    } catch (saveError) {
      setFormError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(video) {
    const name = value(video, 'originalFileName', 'OriginalFileName', 'this video')
    if (!window.confirm(`Delete "${name}"?`)) return
    try {
      await deleteProductVideo(value(video, 'productVideoId', 'ProductVideoId'))
      await load()
    } catch (actionError) {
      setError(actionError.message)
    }
  }

  return (
    <AdminModuleLayout activeModule="videos" title="Product videos" user={user} onLogout={onLogout} onNavigate={onNavigate}>
      <section className="page-content module-page">
        <div className="module-heading"><div><p className="module-eyebrow">PRODUCT MEDIA</p><h1>Product videos</h1><p>Upload product videos directly from your device gallery.</p></div><button className="module-button primary" onClick={startCreate} type="button">Add video</button></div>
        <div className="module-toolbar"><div className="module-toolbar-group">
          <select aria-label="Filter by product" className="module-select module-filter" onChange={(event) => setProductFilter(event.target.value)} value={productFilter}><option value="">All products</option>{products.map((product) => <option key={value(product, 'productId', 'ProductId')} value={value(product, 'productId', 'ProductId')}>{value(product, 'productName', 'ProductName')}</option>)}</select>
          <select aria-label="Filter by preview type" className="module-select module-filter" onChange={(event) => setPreviewFilter(event.target.value)} value={previewFilter}><option value="">All video types</option><option value="true">Illustrative previews</option><option value="false">Product videos</option></select>
        </div><button className="module-button" onClick={load} type="button">Refresh</button></div>
        {showForm && <section className="module-form-panel">
          <h2>{editing ? 'Edit video record' : 'Add product video'}</h2>{formError && <p className="module-alert" role="alert">{formError}</p>}
          <form className="module-form" onSubmit={submit}>
            <label className="module-field">Product<select className="module-select" onChange={(event) => setForm({ ...form, ProductId: event.target.value })} required value={form.ProductId}><option value="">Select product</option>{products.map((product) => <option key={value(product, 'productId', 'ProductId')} value={value(product, 'productId', 'ProductId')}>{value(product, 'productName', 'ProductName')}</option>)}</select></label>
            <label className="module-field">{editing ? 'Replace video (optional)' : 'Video file'}<input accept="video/mp4,video/webm,video/ogg" className="module-input" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} required={!editing} type="file" /></label>
            <p className="module-field">MP4, WebM ya OGG · Maximum 100 MB{editing ? ` · Current file: ${form.OriginalFileName}` : ''}</p>
            <label className="module-checkbox"><input checked={form.IsIllustrativePreview} onChange={(event) => setForm({ ...form, IsIllustrativePreview: event.target.checked })} type="checkbox" />Illustrative preview</label>
            <div className="module-form-actions"><button className="module-button" disabled={saving} onClick={() => setShowForm(false)} type="button">Cancel</button><button className="module-button primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save video'}</button></div>
          </form>
        </section>}
        <section className="module-panel">
          <div className="module-panel-heading"><h2>Video records</h2><span>{videos.length} records</span></div>
          {error && <div className="module-state error" role="alert">{error}</div>}
          {loading ? <div className="module-state">Loading videos…</div> : videos.length === 0 ? <div className="module-state">No product videos found for these filters.</div> : (
            <div className="module-table-wrap"><table className="module-table"><thead><tr><th>Video</th><th>Product</th><th>Preview</th><th>Size</th><th>Actions</th></tr></thead><tbody>
              {videos.map((video) => {
                const id = value(video, 'productVideoId', 'ProductVideoId')
                return <tr key={id}><td><strong>{value(video, 'originalFileName', 'OriginalFileName')}</strong><span className="muted">Uploaded file</span></td><td>{value(video, 'productName', 'ProductName', `Product ${value(video, 'productId', 'ProductId', '')}`)}</td><td>{isEnabled(value(video, 'isIllustrativePreview', 'IsIllustrativePreview', false)) ? 'Illustrative' : 'Regular'}</td><td>{(Number(value(video, 'fileSize', 'FileSize', 0)) / (1024 * 1024)).toFixed(2)} MB</td><td><div className="module-row-actions"><button className="module-button" onClick={() => startEdit(video)} type="button">Edit</button><button className="module-button danger" onClick={() => remove(video)} type="button">Delete</button></div></td></tr>
              })}
            </tbody></table></div>
          )}
        </section>
      </section>
    </AdminModuleLayout>
  )
}

export default ProductVideosPage
