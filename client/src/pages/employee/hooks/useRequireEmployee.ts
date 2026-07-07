import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmployee } from "@/pages/employee/context/EmployeeContext"

export function useRequireEmployee() {
  const navigate = useNavigate()
  const { employeeId, isReady } = useEmployee()

  useEffect(() => {
    if (isReady && !employeeId) {
      navigate('/employee', { replace: true })
    }
  }, [employeeId, isReady, navigate])

  return { employeeId, isReady }
}
