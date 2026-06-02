import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { dataCollections, sidebarSections, trackingCollections } from '../config/navigation'

export function Sidebar() {
  const location = useLocation()
  const hasActiveTracking = trackingCollections.some((item) =>
    location.pathname.startsWith(item.path),
  )
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(hasActiveTracking)

  useEffect(() => {
    if (hasActiveTracking) {
      setIsMaterialsOpen(true)
    }
  }, [hasActiveTracking])

  return (
    <SidebarContainer aria-label="ניווט ראשי">
      <SidebarBrand>
        <SidebarBrandTitle>Gadash</SidebarBrandTitle>
      </SidebarBrand>

      <SidebarNav>
        <SidebarSection>
          <SidebarSectionTitle>{sidebarSections[0].title}</SidebarSectionTitle>
          <SidebarList>
            {dataCollections.map((item) => (
              <li key={item.id}>
                <SidebarLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
                  }
                >
                  {item.label}
                </SidebarLink>
              </li>
            ))}
          </SidebarList>
        </SidebarSection>

        <SidebarSection>
          <SidebarSectionTitle>{sidebarSections[1].title}</SidebarSectionTitle>
          <SidebarGroup
            open={isMaterialsOpen}
            onToggle={(event) => setIsMaterialsOpen(event.currentTarget.open)}
          >
            <SidebarGroupSummary>חומרים</SidebarGroupSummary>
            <SidebarListNested>
              {trackingCollections.map((item) => (
                <li key={item.id}>
                  <SidebarNestedLink
                    to={item.path}
                    className={({ isActive }) =>
                      `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
                    }
                  >
                    {item.label}
                  </SidebarNestedLink>
                </li>
              ))}
            </SidebarListNested>
          </SidebarGroup>
        </SidebarSection>

        <SidebarSection>
          <SidebarSectionTitleLink
            to={sidebarSections[2].path}
            className={({ isActive }) =>
              `sidebar-section-title-link${isActive ? ' sidebar-section-title-link--active' : ''}`
            }
          >
            {sidebarSections[2].title}
          </SidebarSectionTitleLink>
        </SidebarSection>
      </SidebarNav>
    </SidebarContainer>
  )
}

const SidebarContainer = styled.aside`
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--sidebar-bg);
  border-inline-start: 1px solid var(--border-color);
  height: 100vh;
  position: sticky;
  top: 0;
  overflow-y: auto;
`

const SidebarBrand = styled.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
`

const SidebarBrandTitle = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--accent);
`

const SidebarNav = styled.nav`
  flex: 1;
  padding: 0.75rem 0 1.5rem;
`

const SidebarSection = styled.section`
  margin-bottom: 0.5rem;
`

const SidebarSectionTitle = styled.h2`
  margin: 0;
  padding: 0.75rem 1.5rem 0.35rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
`

const SidebarList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`

const SidebarLink = styled(NavLink)`
  display: block;
  padding: 0.5rem 1.5rem;
  font-size: 0.9375rem;
  color: var(--text-secondary);
  text-decoration: none;
  border-inline-end: 3px solid transparent;
  transition: background 0.15s, color 0.15s, border-color 0.15s;

  &:hover {
    background: var(--hover-bg);
    color: var(--text-primary);
  }

  &.sidebar-link--active {
    background: var(--active-bg);
    color: var(--accent);
    border-inline-end-color: var(--accent);
    font-weight: 600;
  }
`

const SidebarGroup = styled.details`
  margin: 0;
`

const SidebarGroupSummary = styled.summary`
  display: block;
  list-style: none;
  cursor: pointer;
  padding: 0.5rem 1.5rem;
  font-size: 0.9375rem;
  color: var(--text-secondary);
  text-decoration: none;
  border-inline-end: 3px solid transparent;
  transition: background 0.15s, color 0.15s, border-color 0.15s;

  &:hover {
    background: var(--hover-bg);
    color: var(--text-primary);
  }

  &::-webkit-details-marker {
    display: none;
  }
`

const SidebarListNested = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  padding-inline-start: 0.5rem;
`

const SidebarNestedLink = styled(SidebarLink)`
  padding-inline-start: 2.25rem;
`

const SidebarSectionTitleLink = styled(NavLink)`
  display: block;
  margin: 0;
  padding: 0.75rem 1.5rem 0.35rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-decoration: none;
  color: var(--text-muted);
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: var(--text-primary);
    background: var(--hover-bg);
  }

  &.sidebar-section-title-link--active {
    color: var(--accent);
    background: var(--active-bg);
  }
`
