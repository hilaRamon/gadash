import { useNavigate } from 'react-router-dom'
import { LogoutIcon } from "@/components/collection/Icons"
import { useAuth } from "@/context/AuthContext"
import { EmployeeActionMenu } from './components/EmployeeActionMenu'
import { useEmployee } from './context/EmployeeContext'
import {
  EmployeeActionsRow,
  EmployeeCenteredContent,
  EmployeeCenteredShell,
  EmployeeHeader,
  EmployeeSubtitle,
  EmployeeTitle,
  TextButton,
} from './employeeStyles'

export function EmployeeHomePage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { employeeName, isReady } = useEmployee()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (!isReady) {
    return (
      <EmployeeCenteredShell>
        <EmployeeCenteredContent>
          <EmployeeTitle>טוען...</EmployeeTitle>
        </EmployeeCenteredContent>
      </EmployeeCenteredShell>
    )
  }

  return (
    <EmployeeCenteredShell>
      <EmployeeCenteredContent>
        <EmployeeHeader>
          <div>
            <EmployeeTitle>שלום, {employeeName ?? 'עובד'}</EmployeeTitle>
            <EmployeeSubtitle>מה תרצו לדווח?</EmployeeSubtitle>
          </div>
        </EmployeeHeader>

        <EmployeeActionMenu />

        <EmployeeActionsRow>
          <TextButton type="button" onClick={handleLogout}>
            <LogoutIcon size={18} />
            התנתק
          </TextButton>
        </EmployeeActionsRow>
      </EmployeeCenteredContent>
    </EmployeeCenteredShell>
  )
}
