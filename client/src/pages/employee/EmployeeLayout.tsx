import { Outlet } from 'react-router-dom'
import { EmployeeProvider } from './context/EmployeeContext'
import { EmployeePage } from './employeeStyles'

export function EmployeeLayout() {
  return (
    <EmployeeProvider>
      <EmployeePage dir="rtl">
        <Outlet />
      </EmployeePage>
    </EmployeeProvider>
  )
}
