import { cn } from '../../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'dark' | 'bordered'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

const variants = {
  default: 'bg-white border border-hairline',
  glass: 'glass',
  dark: 'bg-surface-dark text-white border border-white/10',
  bordered: 'bg-white border-2 border-hairline',
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({ children, className, variant = 'default', padding = 'md', hover }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-sm',
        variants[variant],
        paddings[padding],
        hover && 'card-hover cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
