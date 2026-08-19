import { cn } from '../../lib/utils'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ className, label, error, options, placeholder, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-caption font-medium text-ink">{label}</label>
      )}
      <div className="relative">
        <select
          className={cn(
            'w-full appearance-none rounded-sm border border-hairline bg-white px-4 py-3 pr-10 text-body text-ink transition-colors focus:border-form-focus focus:ring-1 focus:ring-form-focus focus:outline-none',
            error && 'border-error-red',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-slate pointer-events-none" />
      </div>
      {error && <p className="text-caption text-error-red">{error}</p>}
    </div>
  )
}
