import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Bot, Wallet, ShoppingBag, BarChart3,
  Settings, Bell, Users, Key, ChevronLeft, ChevronRight,
  LogOut, Plus, Search, Zap, Menu, X, HelpCircle, FileText,
  CreditCard, Puzzle,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { useUIStore } from '../stores/uiStore'
import { useAuth } from '../providers/AuthProvider'
import { useIsMobile } from '../hooks/useMediaQuery'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { WalletConnectButton } from '../components/wallet/WalletConnectButton'
import { useState } from 'react'

const navItems = [
  { group: 'Main', items: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Marketplace', icon: ShoppingBag, path: '/marketplace' },
    { label: 'My Agents', icon: Bot, path: '/dashboard/agents', role: 'developer' },
    { label: 'Analytics', icon: BarChart3, path: '/dashboard/analytics' },
  ]},
  { group: 'Financial', items: [
    { label: 'Wallet', icon: Wallet, path: '/dashboard/wallet' },
    { label: 'Billing', icon: CreditCard, path: '/dashboard/billing' },
  ]},
  { group: 'Developer', items: [
    { label: 'API Keys', icon: Key, path: '/dashboard/api-keys', role: 'developer' },
    { label: 'Integrations', icon: Puzzle, path: '/dashboard/integrations' },
  ]},
  { group: 'Admin', items: [
    { label: 'Admin Panel', icon: Users, path: '/admin', role: 'admin' },
  ]},
]

const bottomItems = [
  { label: 'Notifications', icon: Bell, path: '/dashboard/notifications' },
  { label: 'Settings', icon: Settings, path: '/dashboard/settings' },
  { label: 'Help', icon: HelpCircle, path: '/docs' },
]

export function DashboardLayout() {
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [mobileSidebar, setMobileSidebar] = useState(false)

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-hairline">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-near-black flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-heading font-semibold">Agenova</span>
        </Link>
        {!isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-sm text-muted-slate hover:text-ink hover:bg-soft-stone/50 transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide py-4 px-3 space-y-6">
        {navItems.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (item.role && user?.role !== item.role) return false
            return true
          })
          if (visibleItems.length === 0) return null
          return (
            <div key={group.group}>
              {sidebarOpen && (
                <p className="text-label text-muted-slate uppercase tracking-wider px-3 mb-2">{group.group}</p>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-sm text-body transition-colors',
                      isActive(item.path)
                        ? 'bg-near-black text-white font-medium'
                        : 'text-muted-slate hover:text-ink hover:bg-soft-stone/50',
                      !sidebarOpen && 'justify-center px-2'
                    )}
                    title={!sidebarOpen ? item.label : undefined}
                    onClick={() => { if (isMobile) setMobileSidebar(false) }}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-hairline p-3 space-y-1">
        {bottomItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-sm text-body transition-colors',
              isActive(item.path)
                ? 'bg-near-black text-white font-medium'
                : 'text-muted-slate hover:text-ink hover:bg-soft-stone/50',
              !sidebarOpen && 'justify-center px-2'
            )}
            title={!sidebarOpen ? item.label : undefined}
            onClick={() => { if (isMobile) setMobileSidebar(false) }}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>{item.label}</span>}
          </Link>
        ))}
      </div>

      <div className="border-t border-hairline p-3">
        <div className={cn('flex items-center gap-3', !sidebarOpen && 'justify-center')}>
          <Link to="/dashboard/settings" onClick={() => { if (isMobile) setMobileSidebar(false) }}>
            <Avatar name={user?.name || 'User'} size="sm" />
          </Link>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <Link to="/dashboard/settings" className="block">
                <p className="text-button font-medium text-ink truncate">{user?.name || 'User'}</p>
                <p className="text-caption text-muted-slate truncate">{user?.email}</p>
              </Link>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="p-1.5 text-muted-slate hover:text-error-red transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-soft-stone/30">
      {isMobile && mobileSidebar && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebar(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white animate-slide-down">
            {sidebar}
          </div>
        </div>
      )}

      {!isMobile && (
        <aside
          className={cn(
            'fixed left-0 top-0 bottom-0 z-40 bg-white border-r border-hairline transition-all duration-300',
            sidebarOpen ? 'w-64' : 'w-16'
          )}
        >
          {sidebar}
        </aside>
      )}

      <div className={cn('transition-all duration-300', !isMobile && (sidebarOpen ? 'ml-64' : 'ml-16'))}>
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-glass border-b border-hairline">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="flex items-center gap-3">
              {isMobile && (
                <button
                  onClick={() => setMobileSidebar(true)}
                  className="p-2 text-ink"
                  aria-label="Open sidebar"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-slate" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  className="w-64 pl-9 pr-4 py-2 rounded-sm border border-hairline bg-white text-caption text-ink placeholder:text-muted-slate focus:outline-none focus:border-form-focus"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <WalletConnectButton />
              {user?.role === 'developer' && (
                <Link to="/dashboard/agents/new">
                  <Button size="sm" icon={<Plus className="h-4 w-4" />}>
                    New Agent
                  </Button>
                </Link>
              )}
              <Link to="/dashboard/notifications">
                <button className="relative p-2 text-muted-slate hover:text-ink transition-colors">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-coral rounded-full" />
                </button>
              </Link>
              <Link to="/dashboard/settings">
                <Avatar name={user?.name || 'User'} size="sm" />
              </Link>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
