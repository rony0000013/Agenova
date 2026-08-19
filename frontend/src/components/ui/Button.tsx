import { forwardRef } from 'react'
import { cn } from '../../lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

const variants = {
  primary:
    'bg-near-black text-white hover:bg-near-black/90 rounded-pill',
  secondary:
    'text-ink underline-offset-2 hover:underline rounded-pill',
  outline:
    'border border-hairline text-ink hover:bg-soft-stone/50 rounded-pill',
  ghost:
    'text-muted-slate hover:text-ink hover:bg-soft-stone/50 rounded-pill',
  danger:
    'bg-error-red text-white hover:bg-error-red/90 rounded-pill',
}

const sizes = {
  sm: 'px-4 py-2 text-caption',
  md: 'px-6 py-3 text-button',
  lg: 'px-8 py-4 text-button',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 transition-all duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
