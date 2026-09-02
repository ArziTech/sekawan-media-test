import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-amber-500 text-slate-950 hover:bg-amber-400',
        secondary: 'border-transparent bg-slate-800 text-slate-200 hover:bg-slate-700',
        destructive: 'border-transparent bg-rose-500/20 text-rose-400 border border-rose-500/30',
        outline: 'text-slate-300 border border-slate-700',
        emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 border',
        blue: 'border-blue-500/30 bg-blue-500/10 text-blue-400 border',
        amber: 'border-amber-500/30 bg-amber-500/10 text-amber-400 border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
