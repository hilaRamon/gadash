import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { EmployeeActionMenu } from './components/EmployeeActionMenu'
import { OptionalTrackingDate } from './components/OptionalTrackingDate'
import { useEmployee } from './context/EmployeeContext'
import {
  EmployeeContent,
  EmployeeHeader,
  EmployeeSubtitle,
  EmployeeTitle,
} from './employeeStyles'

export function EmployeeHomePage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { employeeName, isCustomDate, trackingDate, isReady } = useEmployee()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (!isReady) {
    return (
      <EmployeeContent>
        <EmployeeTitle>טוען...</EmployeeTitle>
      </EmployeeContent>
    )
  }

  return (
    <EmployeeContent>
      <EmployeeHeader>
        <div>
          <EmployeeTitle>שלום, {employeeName ?? 'עובד'}</EmployeeTitle>
          <EmployeeSubtitle>
            {isCustomDate
              ? `תאריך: ${new Date(`${trackingDate}T00:00:00`).toLocaleDateString('he-IL')}`
              : 'תאריך: היום · מה תרצו לדווח?'}
          </EmployeeSubtitle>
        </div>
      </EmployeeHeader>

      <EmployeeActionMenu />

      <OptionalTrackingDate onLogout={handleLogout} />
    </EmployeeContent>
  )
}
