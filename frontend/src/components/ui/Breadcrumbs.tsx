import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

const LABEL_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  marketplace: 'Marketplace',
  agents: 'My Agents',
  'agents/new': 'Create Agent',
  wallet: 'Wallet',
  billing: 'Billing',
  'api-keys': 'API Keys',
  integrations: 'Integrations',
  notifications: 'Notifications',
  settings: 'Settings',
  analytics: 'Analytics',
  admin: 'Admin',
}

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null

  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/')
    const label = LABEL_MAP[seg] || seg.charAt(0).toUpperCase() + seg.slice(1)
    const isLast = i === segments.length - 1

    return { label, path, isLast }
  })

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-1.5 text-caption text-muted-slate">
        <li>
          <Link to="/dashboard" className="hover:text-ink transition-colors">Home</Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.path} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3" />
            {crumb.isLast ? (
              <span className="text-ink font-medium">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="hover:text-ink transition-colors">{crumb.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}