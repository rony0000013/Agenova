import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-caption font-medium text-ink">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-slate">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-sm border border-hairline bg-white px-4 py-3 text-body text-ink placeholder:text-muted-slate transition-colors focus:border-form-focus focus:ring-1 focus:ring-form-focus focus:outline-none',
              icon && 'pl-10',
              error && 'border-error-red focus:border-error-red focus:ring-error-red',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-caption text-error-red">{error}</p>}
        {hint && !error && <p className="text-caption text-muted-slate">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
