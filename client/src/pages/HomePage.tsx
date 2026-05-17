import { Navigate } from 'react-router-dom'
import { dataCollections } from '../config/navigation'

export function HomePage() {
  return <Navigate to={dataCollections[0].path} replace />
}
