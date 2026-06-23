import { useCollectionList } from '../../hooks/collections/useCollectionList'
import { EmployeeActionMenu } from './components/EmployeeActionMenu'
import { OptionalTrackingDate } from './components/OptionalTrackingDate'
import { useEmployee } from './context/EmployeeContext'
import {
  EmployeeContent,
  EmployeeHeader,
  EmployeePickerButton,
  EmployeePickerList,
  EmployeeSubtitle,
  EmployeeTitle,
} from './employeeStyles'

export function EmployeeHomePage() {
  const { employeeId, employeeName, isCustomDate, trackingDate, setEmployee, clearEmployee, isReady } =
    useEmployee()
  const { data: employees = [], isLoading } = useCollectionList('employees')

  if (!isReady) {
    return (
      <EmployeeContent>
        <EmployeeTitle>טוען...</EmployeeTitle>
      </EmployeeContent>
    )
  }

  if (!employeeId) {
    return (
      <EmployeeContent>
        <EmployeeHeader>
          <div>
            <EmployeeTitle>ברוכים הבאים</EmployeeTitle>
            <EmployeeSubtitle>בחרו את שמכם כדי להמשיך</EmployeeSubtitle>
          </div>
        </EmployeeHeader>

        <EmployeePickerList>
          {isLoading ? (
            <EmployeeSubtitle>טוען עובדים...</EmployeeSubtitle>
          ) : (
            employees.map((employee) => (
              <EmployeePickerButton
                key={String(employee._id)}
                type="button"
                onClick={() =>
                  setEmployee(String(employee._id), String(employee.name ?? ''))
                }
              >
                {String(employee.name ?? employee._id)}
              </EmployeePickerButton>
            ))
          )}
        </EmployeePickerList>
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

      <OptionalTrackingDate onClearEmployee={clearEmployee} />
    </EmployeeContent>
  )
}
