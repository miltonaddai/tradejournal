import { cn } from '@/lib/utils'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'strong' | 'pill' | 'dark'
}

export function GlassCard({ className, variant = 'default', children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        variant === 'strong' && 'glass-strong rounded-2xl',
        variant === 'pill' && 'glass-pill',
        variant === 'dark' && 'glass-dark rounded-2xl',
        variant === 'default' && 'glass rounded-2xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
