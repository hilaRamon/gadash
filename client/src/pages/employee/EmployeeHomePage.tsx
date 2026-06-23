import { useNavigate } from 'react-router-dom'
import { useCollectionList } from '../../hooks/collections/useCollectionList'
import { OptionalTrackingDate } from './components/OptionalTrackingDate'
import { useEmployee } from './context/EmployeeContext'
import {
  ActionCard,
  ActionCardList,
  EmployeeContent,
  EmployeeHeader,
  EmployeePickerButton,
  EmployeePickerList,
  EmployeeSubtitle,
  EmployeeTitle,
} from './employeeStyles'

const ACTIONS = [
  { path: '/employee/field-work', label: 'משימת עיבוד' },
  { path: '/employee/admin', label: 'משימת מנהלה' },
  { path: '/employee/material', label: 'שימוש בחומר' },
  { path: '/employee/fuel', label: 'פעולת דלק' },
] as const

export function EmployeeHomePage() {
  const navigate = useNavigate()
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
              : 'תאריך: היום'}
          </EmployeeSubtitle>
        </div>
      </EmployeeHeader>

      <ActionCardList>
        {ACTIONS.map((action) => (
          <ActionCard
            key={action.path}
            type="button"
            onClick={() => navigate(action.path)}
          >
            {action.label}
          </ActionCard>
        ))}
      </ActionCardList>

      <OptionalTrackingDate onClearEmployee={clearEmployee} />
    </EmployeeContent>
  )
}
