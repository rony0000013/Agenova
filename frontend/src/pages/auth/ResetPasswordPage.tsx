import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { authApi } from '../../api/endpoints'
import { useUIStore } from '../../stores/uiStore'

export function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const addToast = useUIStore((s) => s.addToast)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      addToast({ type: 'error', title: 'Passwords do not match' })
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword(token!, password)
      addToast({ type: 'success', title: 'Password reset!', message: 'You can now sign in with your new password.' })
      navigate('/login')
    } catch (err) {
      addToast({ type: 'error', title: 'Reset failed', message: err instanceof Error ? err.message : 'Invalid or expired token' })
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
        <h1 className="text-display font-display text-near-black mb-2">Reset password</h1>
        <p className="text-body text-muted-slate mb-6">Enter your new password below.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="New password" type="password" placeholder="Enter new password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Input label="Confirm password" type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          <Button type="submit" loading={loading} className="w-full">Reset password</Button>
        </form>
      </div>
    </div>
  )
}
