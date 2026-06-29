import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { buttonHoverLighten } from '../styles/buttonStyles'
import { PhoneField } from '../components/collection/PhoneField'
import { SearchableSelect } from '../components/ui/SearchableSelect'
import { useAuth } from '../context/AuthContext'
import { fetchLoginOptions } from '../lib/auth'
import { getApiErrorMessage } from '../lib/apiErrorMessage'
import { normalizeMobile } from '../lib/mobileFormat'
import { FieldWorkIcon } from './employee/components/EmployeeMenuIcons'

type LoginOption = {
  _id: string
  name: string
}

const LoginHeader = styled.header`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
  padding: 1.5rem 1.25rem 1.25rem;
  background: var(--color-employee-field-soft);
`

const LoginIconWrap = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 14px;
  background: var(--accent);
  color: var(--text-on-brand);
  flex-shrink: 0;
`

const LoginShell = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  box-sizing: border-box;
  background: var(--page-bg);
  color: var(--text-primary);
`

const LoginCard = styled.div`
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
  overflow: hidden;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  @media (prefers-color-scheme: light) {
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
  }
`

const LoginTitle = styled.h1`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
`

const LoginSubtitle = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--text-secondary);
`

const LoginBody = styled.div`
  padding: 1.25rem 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const LoginField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`

const LoginLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
`

const LoginPhoneWrap = styled.div`
  input {
    width: 100%;
    min-height: 48px;
    padding: 0.65rem 0.75rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--page-bg);
    color: var(--text-primary);
    font: inherit;
    font-size: 16px;
    box-sizing: border-box;

    &:focus {
      outline: 2px solid var(--accent);
      outline-offset: 1px;
    }
  }

  p {
    margin: 0.35rem 0 0;
    font-size: 0.8rem;
  }
`

const LoginError = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: var(--color-error-soft);
  border: 1px solid var(--color-error-border);
  color: var(--color-error-text-muted);
  font-size: 0.9rem;

  @media (prefers-color-scheme: light) {
    color: var(--color-error-text-strong);
  }
`

const LoginSubmit = styled.button`
  width: 100%;
  min-height: 52px;
  margin-top: 0.25rem;
  border: none;
  border-radius: 10px;
  background: var(--accent);
  color: var(--text-on-primary);
  font: inherit;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;

  ${buttonHoverLighten};

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

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

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: employee._id,
        label: employee.name,
      })),
    [employees],
  )

  const handleEmployeeChange = (nextEmployeeId: string) => {
    setEmployeeId(nextEmployeeId)
    setError(null)
    setMobile('')
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
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
    <LoginShell dir="rtl">
      <LoginCard>
        <LoginHeader>
          <LoginIconWrap>
            <FieldWorkIcon size={28} />
          </LoginIconWrap>
          <LoginTitle>התחברות</LoginTitle>
          <LoginSubtitle>
            בחרו את שמכם והזינו את מספר הטלפון שלכם
          </LoginSubtitle>
        </LoginHeader>

        <LoginBody>
          {error ? <LoginError>{error}</LoginError> : null}

          <LoginForm onSubmit={(event) => void handleSubmit(event)}>
            <LoginField>
              <LoginLabel htmlFor="login-employee">שם העובד</LoginLabel>
              <SearchableSelect
                id="login-employee"
                value={employeeId}
                options={employeeOptions}
                isLoading={isLoading}
                required
                size="large"
                onChange={handleEmployeeChange}
              />
            </LoginField>

            <LoginField>
              <LoginLabel htmlFor="login-mobile">טלפון</LoginLabel>
              <LoginPhoneWrap>
                <PhoneField
                  id="login-mobile"
                  value={mobile}
                  onChange={setMobile}
                />
              </LoginPhoneWrap>
            </LoginField>

            <LoginSubmit type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'מתחבר...' : 'התחבר'}
            </LoginSubmit>
          </LoginForm>
        </LoginBody>
      </LoginCard>
    </LoginShell>
  )
}
