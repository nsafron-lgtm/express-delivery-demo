import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatusCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  onClick?: () => void;
  active?: boolean;
}

const variantStyles = {
  default: 'bg-secondary text-muted-foreground',
  primary: 'bg-primary/15 text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  destructive: 'bg-destructive/15 text-destructive',
};

export function StatusCard({ title, value, icon: Icon, variant = 'default', onClick, active }: StatusCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border border-border bg-card p-3 flex flex-col items-center justify-center gap-1 text-center transition-colors min-w-0',
        onClick && 'cursor-pointer hover:border-primary/30',
        active && 'border-primary/50 bg-primary/5'
      )}
    >
      <div className={cn('h-8 w-8 rounded-full flex items-center justify-center shrink-0', variantStyles[variant])}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xl font-bold text-foreground leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground truncate w-full">{title}</p>
    </div>
  );
}
