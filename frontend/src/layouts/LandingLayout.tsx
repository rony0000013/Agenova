import { Outlet, Link } from 'react-router-dom'
import { Menu, X, Zap } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { WalletConnectButton } from '../components/wallet/WalletConnectButton'
import { cn } from '../lib/utils'

export function LandingLayout() {
  const [mobileMenu, setMobileMenu] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-glass border-b border-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-near-black flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-heading font-semibold text-near-black">
                Agenova
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/features" className="text-body text-muted-slate hover:text-ink transition-colors">Features</Link>
              <Link to="/pricing" className="text-body text-muted-slate hover:text-ink transition-colors">Pricing</Link>
              <Link to="/marketplace" className="text-body text-muted-slate hover:text-ink transition-colors">Marketplace</Link>
              <Link to="/docs" className="text-body text-muted-slate hover:text-ink transition-colors">Docs</Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <WalletConnectButton />
              <Link to="/login">
                <Button variant="outline" size="sm">Sign in</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Get started</Button>
              </Link>
            </div>

            <button
              className="md:hidden p-2 text-ink"
              onClick={() => setMobileMenu(!mobileMenu)}
              aria-label="Toggle menu"
            >
              {mobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        <div className={cn('md:hidden border-t border-hairline', mobileMenu ? 'block' : 'hidden')}>
          <div className="px-4 py-4 space-y-3">
            <Link to="/features" className="block text-body text-muted-slate py-2" onClick={() => setMobileMenu(false)}>Features</Link>
            <Link to="/pricing" className="block text-body text-muted-slate py-2" onClick={() => setMobileMenu(false)}>Pricing</Link>
            <Link to="/marketplace" className="block text-body text-muted-slate py-2" onClick={() => setMobileMenu(false)}>Marketplace</Link>
            <Link to="/docs" className="block text-body text-muted-slate py-2" onClick={() => setMobileMenu(false)}>Docs</Link>
            <div className="flex gap-3 pt-2">
              <Link to="/login" className="flex-1" onClick={() => setMobileMenu(false)}>
                <Button variant="outline" className="w-full">Sign in</Button>
              </Link>
              <Link to="/signup" className="flex-1" onClick={() => setMobileMenu(false)}>
                <Button className="w-full">Get started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        <Outlet />
      </main>

      <footer className="bg-near-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="font-display text-heading font-semibold">Agenova</span>
              </div>
              <p className="text-body text-muted-slate">
                Decentralized AI agent marketplace powered by Stellar.
              </p>
            </div>
            <div>
              <h4 className="text-button font-medium text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/marketplace" className="text-body text-muted-slate hover:text-white transition-colors">Marketplace</Link></li>
                <li><Link to="/pricing" className="text-body text-muted-slate hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/features" className="text-body text-muted-slate hover:text-white transition-colors">Features</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-button font-medium text-white mb-4">Developers</h4>
              <ul className="space-y-2">
                <li><Link to="/docs" className="text-body text-muted-slate hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="/signup" className="text-body text-muted-slate hover:text-white transition-colors">Become a creator</Link></li>
                <li><Link to="/api" className="text-body text-muted-slate hover:text-white transition-colors">API Reference</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-button font-medium text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-body text-muted-slate hover:text-white transition-colors">About</Link></li>
                <li><Link to="/contact" className="text-body text-muted-slate hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/privacy" className="text-body text-muted-slate hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-caption text-muted-slate">&copy; 2026 Agenova. All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="/terms" className="text-caption text-muted-slate hover:text-white transition-colors">Terms</Link>
              <Link to="/privacy" className="text-caption text-muted-slate hover:text-white transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
