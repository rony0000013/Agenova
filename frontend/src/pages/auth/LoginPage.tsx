import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../providers/AuthProvider'
import { useUIStore } from '../../stores/uiStore'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login, loginWithWallet } = useAuth()

  const navigate = useNavigate()
  const addToast = useUIStore((s) => s.addToast)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      await login(email, password)
      addToast({ type: 'success', title: 'Welcome back!' })
      navigate('/dashboard')
    } catch (err) {
      addToast({ type: 'error', title: 'Login failed', message: err instanceof Error ? err.message : 'Invalid credentials' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-near-black flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-heading font-semibold">Agenova</span>
            </Link>
            <h1 className="text-display font-display text-near-black mb-2">Welcome back</h1>
            <p className="text-body text-muted-slate">Sign in to your account to continue</p>
          </div>

          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={async () => {
                setLoading(true)
                try {
                  const { connectFreighter } = await import('../../lib/freighter')
                  const pubKey = await connectFreighter()
                  await loginWithWallet(pubKey)
                  addToast({ type: 'success', title: 'Wallet Connected!', message: `Signed in as ${pubKey.slice(0, 6)}...${pubKey.slice(-4)}` })
                  navigate('/dashboard')
                } catch (err: any) {
                  addToast({ type: 'error', title: 'Freighter Auth Failed', message: err.message || 'Could not connect wallet' })
                } finally {
                  setLoading(false)
                }
              }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-near-black text-white hover:bg-near-black/90 font-medium rounded-pill shadow-sm transition-all text-body"
            >
              <Zap className="h-4 w-4 text-coral" />
              Connect Freighter Stellar Wallet
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-hairline" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-4 text-caption text-muted-slate">or sign in with email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-muted-slate hover:text-ink"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-hairline" />
                <span className="text-caption text-muted-slate">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-caption text-action-blue hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Sign in with Email
            </Button>
          </form>

          <p className="text-center text-caption text-muted-slate mt-8">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-action-blue hover:underline font-medium">Create one</Link>
          </p>

        </div>
      </div>
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-600 to-indigo-800 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <Zap className="h-16 w-16 mb-6 text-indigo-200" />
          <h2 className="text-display font-display mb-4">Decentralized AI for everyone</h2>
          <p className="text-body-lg text-indigo-200 leading-relaxed">
            Access powerful AI agents with transparent Stellar micropayments. No hidden fees, no lock-in.
          </p>
        </div>
      </div>
    </div>
  )
}
