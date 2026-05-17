import { dataCollections } from '../config/navigation'
import './Page.css'

type CollectionPageProps = {
  collectionId: string
}

export function CollectionPage({ collectionId }: CollectionPageProps) {
  const collection = dataCollections.find((c) => c.id === collectionId)

  if (!collection) {
    return (
      <div className="page">
        <h1 className="page-title">לא נמצא</h1>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">{collection.label}</h1>
        <p className="page-subtitle">אוסף: {collection.collection}</p>
      </header>
      <section className="page-body">
        <p className="page-placeholder">תוכן העמוד יתווסף בהמשך.</p>
      </section>
    </div>
  )
}
