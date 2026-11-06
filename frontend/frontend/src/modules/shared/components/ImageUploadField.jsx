import { useEffect, useMemo, useRef, useState } from 'react'
import { getProductImageUrl } from '../../product/api/productApi.js'
import './ImageUploadField.css'

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_FILE_SIZE = 15 * 1024 * 1024

function ImageUploadField({ id, label, value, file, onFileChange, onClear, hint }) {
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : '', [file])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function chooseFile(nextFile) {
    if (!nextFile) return
    if (!IMAGE_TYPES.has(nextFile.type)) {
      setError('JPEG, PNG, WebP ya GIF image select karein.')
      return
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setError('Image ka size 15 MB ya usse kam hona chahiye.')
      return
    }
    setError('')
    onFileChange(nextFile)
  }

  const preview = previewUrl || (value ? getProductImageUrl(value) : '')

  return (
    <div
      className="image-upload-field"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        chooseFile(event.dataTransfer.files?.[0])
      }}
    >
      <input
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="image-upload-input"
        id={id}
        onChange={(event) => {
          chooseFile(event.target.files?.[0])
          event.target.value = ''
        }}
        ref={inputRef}
        type="file"
      />
      {preview ? (
        <div className="image-upload-preview">
          <img alt={`${label} preview`} src={preview} />
          <div className="image-upload-copy">
            <strong>{file?.name || 'Current image'}</strong>
            <span>{hint}</span>
            <div className="image-upload-actions">
              <button aria-label={`Replace ${label.toLowerCase()}`} onClick={() => inputRef.current?.click()} type="button">Replace image</button>
              <button aria-label={`Remove ${label.toLowerCase()}`} onClick={() => { setError(''); onClear() }} type="button">Remove</button>
            </div>
          </div>
        </div>
      ) : (
        <button className="image-upload-dropzone" onClick={() => inputRef.current?.click()} type="button">
          <strong>Choose {label.toLowerCase()} or drop it here</strong>
          <span>{hint}</span>
        </button>
      )}
      {error && <span className="image-upload-error" role="alert">{error}</span>}
    </div>
  )
}

export default ImageUploadField
