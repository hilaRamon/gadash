import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import './AppLayout.css'

export function AppLayout() {
  return (
    <div className="app-layout" dir="rtl">
      <Sidebar />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}
