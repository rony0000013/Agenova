import { cn } from '../../lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'card' | 'avatar' | 'image'
}

export function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  const variants = {
    text: 'h-4 w-full',
    card: 'h-48 w-full rounded-sm',
    avatar: 'h-10 w-10 rounded-full',
    image: 'h-64 w-full rounded-sm',
  }

  return <div className={cn('skeleton', variants[variant], className)} />
}

export function CardSkeleton() {
  return (
    <div className="p-6 border border-hairline rounded-sm space-y-4">
      <Skeleton variant="avatar" />
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-1/2" />
      <Skeleton variant="text" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border border-hairline rounded-sm">
          <Skeleton variant="text" className="w-1/4" />
          <Skeleton variant="text" className="w-1/4" />
          <Skeleton variant="text" className="w-1/4" />
          <Skeleton variant="text" className="w-1/4" />
        </div>
      ))}
    </div>
  )
}
