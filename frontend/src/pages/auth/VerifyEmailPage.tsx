import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Zap, Mail } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { authApi } from '../../api/endpoints'
import { useUIStore } from '../../stores/uiStore'

export function VerifyEmailPage() {
  const { token } = useParams()
  const [verified, setVerified] = useState(!!token)
  const [loading, setLoading] = useState(false)
  const addToast = useUIStore((s) => s.addToast)

  const handleVerify = async () => {
    if (!token) return
    setLoading(true)
    try {
      await authApi.verifyEmail(token)
      setVerified(true)
      addToast({ type: 'success', title: 'Email verified!' })
    } catch (err) {
      addToast({ type: 'error', title: 'Verification failed', message: err instanceof Error ? err.message : 'Invalid token' })
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-display font-display text-near-black mb-2">Check your email</h1>
          <p className="text-body text-muted-slate">We sent a verification link to your email. Click it to activate your account.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-pale-green flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-deep-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-display font-display text-near-black mb-2">Email verified!</h1>
        <p className="text-body text-muted-slate mb-6">Your account is now active. You can start using Agenova.</p>
        <a href="/login"><Button>Sign in</Button></a>
      </div>
    </div>
  )
}
