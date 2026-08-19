import { Navigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { PageLoader } from './ui/Spinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) return <PageLoader />

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
