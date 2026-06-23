import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  EmployeeContent,
  EmployeePage,
  EmployeeTitle,
} from '../pages/employee/employeeStyles'

type ProtectedRouteProps = {
  role?: 'admin' | 'employee'
}

function AuthLoading() {
  return (
    <EmployeePage dir="rtl">
      <EmployeeContent>
        <EmployeeTitle>טוען...</EmployeeTitle>
      </EmployeeContent>
    </EmployeePage>
  )
}

export function ProtectedRoute({ role }: ProtectedRouteProps) {
  const { isReady, isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isReady) {
    return <AuthLoading />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (role === 'admin' && user?.role !== 'admin') {
    return <Navigate to="/employee" replace />
  }

  return <Outlet />
}

export function GuestRoute() {
  const { isReady, isAuthenticated, user } = useAuth()

  if (!isReady) {
    return <AuthLoading />
  }

  if (isAuthenticated) {
    return (
      <Navigate to={user?.role === 'admin' ? '/' : '/employee'} replace />
    )
  }

  return <Outlet />
}
