import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useFormSuccessRedirect(success: boolean, path = '/employee') {
  const navigate = useNavigate()

  useEffect(() => {
    if (!success) return
    const timer = window.setTimeout(() => navigate(path), 1500)
    return () => window.clearTimeout(timer)
  }, [success, navigate, path])
}
