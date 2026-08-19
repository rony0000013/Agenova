import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Wallet, ExternalLink, AlertCircle, ArrowLeft } from 'lucide-react'
import { connectFreighter, isFreighterInstalled } from '../../lib/freighter'
import { useAuth } from '../../providers/AuthProvider'
import { useUIStore } from '../../stores/uiStore'

export function SignInPage() {
  const navigate = useNavigate()
  const { loginWithWallet } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const addToast = useUIStore((s) => s.addToast)

  const handleFreighterConnect = async () => {
    setLoading(true)
    setError('')
    try {
      // 1. Handshake with Freighter Wallet Extension
      const publicKey = await connectFreighter()

      // 2. Authenticate with backend using Stellar public key (G...)
      await loginWithWallet(publicKey)

      addToast({
        type: 'success',
        title: 'Wallet Connected',
        message: `Authenticated with Stellar Address ${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`,
      })

      // 3. Redirect to main dashboard
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err.message || 'Failed to sign in with Freighter Wallet.'
      setError(msg)
      addToast({ type: 'error', title: 'Connection Failed', message: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between p-6 md:p-12">
      <div>
        <Link to="/" className="inline-flex items-center gap-2 text-caption text-muted-slate hover:text-ink transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-near-black flex items-center justify-center shadow-lg">
          <Zap className="h-8 w-8 text-coral animate-pulse" />
        </div>

        <div>
          <h1 className="text-display font-display text-near-black mb-2">Sign In with Stellar Wallet</h1>
          <p className="text-body text-muted-slate">
            Non-custodial authentication powered by Stellar Freighter Chrome Extension.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-left flex gap-3 items-start text-caption text-red-800">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Authentication Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-4 pt-4">
          <button
            onClick={handleFreighterConnect}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-near-black text-white hover:bg-near-black/90 font-medium rounded-pill shadow-md transition-all text-body hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <Wallet className="h-5 w-5 text-coral" />
            {loading ? 'Connecting Freighter Wallet...' : 'Connect Freighter Wallet'}
          </button>

          <a
            href="https://www.freighter.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-caption text-action-blue hover:underline font-medium"
          >
            Don&apos;t have Freighter installed? Get it here <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="pt-8 border-t border-hairline flex flex-col gap-2">
          <p className="text-caption text-muted-slate">Prefer standard email login?</p>
          <Link to="/login" className="text-caption font-medium text-near-black hover:underline">
            Sign in with Email & Password
          </Link>
        </div>
      </div>

      <div className="text-center text-caption text-muted-slate pt-8">
        Agenova AI Marketplace &copy; 2026. Secured by Stellar Soroban.
      </div>
    </div>
  )
}
