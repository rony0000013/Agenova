import { cn, getInitials } from '../../lib/utils'

interface AvatarProps {
  src?: string
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'h-8 w-8 text-caption',
  md: 'h-10 w-10 text-button',
  lg: 'h-14 w-14 text-heading',
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name)

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-medium',
        sizes[size],
        className
      )}
      aria-label={name}
    >
      {initials}
    </div>
  )
}
