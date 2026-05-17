import './Page.css'

type SectionPageProps = {
  title: string
}

export function SectionPage({ title }: SectionPageProps) {
  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">{title}</h1>
      </header>
      <section className="page-body">
        <p className="page-placeholder">תוכן העמוד יתווסף בהמשך.</p>
      </section>
    </div>
  )
}
