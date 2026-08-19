import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { authApi } from '../../api/endpoints'
import { useUIStore } from '../../stores/uiStore'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const addToast = useUIStore((s) => s.addToast)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
      addToast({ type: 'success', title: 'Reset link sent!', message: 'Check your email for password reset instructions.' })
    } catch (err) {
      addToast({ type: 'error', title: 'Failed', message: err instanceof Error ? err.message : 'Could not send reset email' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-lg bg-near-black flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-heading font-semibold">Agenova</span>
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-pale-green flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-deep-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-display font-display text-near-black mb-2">Check your email</h1>
            <p className="text-body text-muted-slate mb-6">We&apos;ve sent a password reset link to <strong>{email}</strong></p>
            <Link to="/login" className="text-action-blue hover:underline text-body">Back to sign in</Link>
          </div>
        ) : (
          <>
            <Link to="/login" className="flex items-center gap-1 text-caption text-muted-slate hover:text-ink mb-8">
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
            <h1 className="text-display font-display text-near-black mb-2">Forgot password?</h1>
            <p className="text-body text-muted-slate mb-6">Enter your email and we&apos;ll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Button type="submit" loading={loading} className="w-full">Send reset link</Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
