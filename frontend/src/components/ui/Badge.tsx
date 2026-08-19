import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'coral'
  size?: 'sm' | 'md'
  className?: string
}

const variants = {
  default: 'bg-soft-stone text-ink',
  success: 'bg-pale-green text-deep-green',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-error-red',
  info: 'bg-pale-blue text-action-blue',
  coral: 'bg-coral/10 text-coral border border-soft-coral',
}

const sizes = {
  sm: 'px-2 py-0.5 text-label uppercase tracking-wider',
  md: 'px-3 py-1 text-caption',
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center font-medium rounded-pill', variants[variant], sizes[size], className)}>
      {children}
    </span>
  )
}
