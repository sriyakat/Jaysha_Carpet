import Icon from './Icon.jsx'

function readCategory(category, camelName, pascalName, fallback = '') {
  return category?.[camelName] ?? category?.[pascalName] ?? fallback
}

function CategoryTable({ categories, loading, search, error, onSearch, onEdit, onDelete, onAdd }) {
  const hasSearch = search.trim().length > 0

  return (
    <section aria-label="Categories" className="table-card">
      <div className="table-toolbar">
        <div>
          <h2 className="table-title">All categories</h2>
          <p className="table-subtitle">Product groupings and display details</p>
        </div>
        <label className="search-box">
          <Icon name="search" size={16} />
          <input
            aria-label="Search categories"
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search categories..."
            type="search"
            value={search}
          />
        </label>
      </div>

      {error && (
        <div className="inline-error" role="alert">
          <Icon name="warning" size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div aria-live="polite" className="loading-state">
          <span className="spinner" />
          <span>Categories load ho rahi hain...</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <span className="overview-icon"><Icon name="category" size={21} /></span>
          <h3>{hasSearch ? 'Koi matching category nahi mili' : 'Abhi categories nahi hain'}</h3>
          <p>{hasSearch ? 'Search term badal kar dobara try karein.' : 'Pehli category add karke apne products ko organize karein.'}</p>
          {!hasSearch && (
            <button className="primary-button" onClick={onAdd} type="button">
              <Icon name="plus" size={16} />
              Add category
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-scroll">
            <table className="category-table">
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Slug</th>
                  <th scope="col">Description</th>
                  <th scope="col">Order</th>
                  <th scope="col"><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => {
                  const id = readCategory(category, 'categoryId', 'CategoryId', readCategory(category, 'id', 'Id', index))
                  const name = readCategory(category, 'categoryName', 'CategoryName', 'Unnamed category')
                  const slug = readCategory(category, 'slug', 'Slug', '—')
                  const description = readCategory(category, 'description', 'Description', '')
                  const image = readCategory(category, 'imageStorageKey', 'ImageStorageKey')
                  const displayOrder = readCategory(category, 'displayOrder', 'DisplayOrder', 0)

                  return (
                    <tr key={id}>
                      <td>
                        <div className="category-name-cell">
                          <span className="category-thumb">
                            {image
                              ? <img alt="" loading="lazy" src={image} />
                              : <Icon name="image" size={17} />}
                          </span>
                          <span>
                            <span className="category-name">{name}</span>
                            <span className="category-id">ID: {id}</span>
                          </span>
                        </div>
                      </td>
                      <td><span className="slug-text">{slug}</span></td>
                      <td className="description-cell" title={description || 'No description'}>{description || 'No description'}</td>
                      <td><span className="order-badge">{displayOrder}</span></td>
                      <td>
                        <div className="row-actions">
                          <button
                            aria-label={`Edit ${name}`}
                            className="icon-button"
                            onClick={() => onEdit(category)}
                            title="Edit category"
                            type="button"
                          >
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            aria-label={`Delete ${name}`}
                            className="icon-button danger"
                            onClick={() => onDelete(category)}
                            title="Delete category"
                            type="button"
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <footer className="table-footer">
            <span>{categories.length} {categories.length === 1 ? 'category' : 'categories'} shown</span>
            <span>Sorted by display order</span>
          </footer>
        </>
      )}
    </section>
  )
}

export default CategoryTable
