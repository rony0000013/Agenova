import { cn } from '../../lib/utils'
import { Button } from './Button'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="w-16 h-16 rounded-full bg-soft-stone flex items-center justify-center mb-4">
        {icon || <Inbox className="h-8 w-8 text-muted-slate" />}
      </div>
      <h3 className="text-heading font-display text-ink mb-2">{title}</h3>
      {description && <p className="text-body text-muted-slate max-w-md mb-6">{description}</p>}
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  )
}
