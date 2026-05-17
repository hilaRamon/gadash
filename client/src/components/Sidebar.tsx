import { NavLink } from 'react-router-dom'
import { dataCollections, sidebarSections } from '../config/navigation'
import './Sidebar.css'

export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="ניווט ראשי">
      <div className="sidebar-brand">
        <span className="sidebar-brand-title">Gadash</span>
      </div>

      <nav className="sidebar-nav">
        <section className="sidebar-section">
          <h2 className="sidebar-section-title">{sidebarSections[0].title}</h2>
          <ul className="sidebar-list">
            {dataCollections.map((item) => (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </section>

        <section className="sidebar-section">
          <NavLink
            to={sidebarSections[1].path}
            className={({ isActive }) =>
              `sidebar-section-title sidebar-section-title--link${
                isActive ? ' sidebar-section-title--active' : ''
              }`
            }
          >
            {sidebarSections[1].title}
          </NavLink>
        </section>

        <section className="sidebar-section">
          <NavLink
            to={sidebarSections[2].path}
            className={({ isActive }) =>
              `sidebar-section-title sidebar-section-title--link${
                isActive ? ' sidebar-section-title--active' : ''
              }`
            }
          >
            {sidebarSections[2].title}
          </NavLink>
        </section>
      </nav>
    </aside>
  )
}
