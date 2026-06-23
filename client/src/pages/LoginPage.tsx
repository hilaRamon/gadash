import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneField } from '../components/collection/PhoneField'
import { useAuth } from '../context/AuthContext'
import { fetchLoginOptions } from '../lib/auth'
import { getApiErrorMessage } from '../lib/apiErrorMessage'
import { normalizeMobile } from '../lib/mobileFormat'
import {
  EmployeeContent,
  EmployeePage,
  EmployeeSubtitle,
  EmployeeTitle,
  ErrorBanner,
  FormField,
  FormLabel,
  FormSelect,
  FormStack,
  StickySubmitBar,
  StickySubmitInner,
  SubmitButton,
} from './employee/employeeStyles'

type LoginOption = {
  _id: string
  name: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [employeeId, setEmployeeId] = useState('')
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [employees, setEmployees] = useState<LoginOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadEmployees() {
      try {
        const rows = await fetchLoginOptions()
        if (!cancelled) setEmployees(rows)
      } catch (loadError) {
        if (!cancelled) {
          setError(getApiErrorMessage(loadError, 'לא ניתן לטעון את רשימת העובדים'))
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadEmployees()

    return () => {
      cancelled = true
    }
  }, [])

  const handleEmployeeChange = (nextEmployeeId: string) => {
    setEmployeeId(nextEmployeeId)
    setError(null)
    setMobile('')
  }

  const handleSubmit = async () => {
    setError(null)

    if (!employeeId) {
      setError('יש לבחור שם עובד')
      return
    }

    const mobileTrimmed = mobile.trim()
    if (!mobileTrimmed) {
      setError('יש להזין מספר טלפון')
      return
    }

    try {
      normalizeMobile(mobileTrimmed)
    } catch {
      setError('מספר נייד לא תקין')
      return
    }

    setIsSubmitting(true)
    try {
      const user = await login(employeeId, mobileTrimmed)
      navigate(user.role === 'admin' ? '/' : '/employee', { replace: true })
    } catch (loginError) {
      setError(getApiErrorMessage(loginError, 'פרטי התחברות שגויים'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <EmployeePage dir="rtl">
      <EmployeeContent>
        <EmployeeTitle>התחברות</EmployeeTitle>
        <EmployeeSubtitle>בחרו את שמכם והזינו את מספר הטלפון שלכם</EmployeeSubtitle>

        {error ? <ErrorBanner>{error}</ErrorBanner> : null}

        <FormStack>
          <FormField>
            <FormLabel htmlFor="login-employee">שם העובד</FormLabel>
            <FormSelect
              id="login-employee"
              value={employeeId}
              onChange={(event) => handleEmployeeChange(event.target.value)}
            >
              <option value="">{isLoading ? 'טוען...' : 'בחר...'}</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.name}
                </option>
              ))}
            </FormSelect>
          </FormField>

          <FormField>
            <FormLabel htmlFor="login-mobile">טלפון</FormLabel>
            <PhoneField
              id="login-mobile"
              value={mobile}
              onChange={setMobile}
            />
          </FormField>
        </FormStack>
      </EmployeeContent>

      <StickySubmitBar>
        <StickySubmitInner>
          <SubmitButton
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'מתחבר...' : 'התחבר'}
          </SubmitButton>
        </StickySubmitInner>
      </StickySubmitBar>
    </EmployeePage>
  )
}
