import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-sm',
  {
    variants: {
      variant: {
        default: 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20',
        destructive: 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20',
        outline: 'border border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white',
        secondary: 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white',
        ghost: 'hover:bg-slate-800 hover:text-white text-slate-300 shadow-none',
        link: 'text-amber-400 underline-offset-4 hover:underline shadow-none',
        emerald: 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20',
        blue: 'bg-blue-500 text-white hover:bg-blue-400 shadow-blue-500/20',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-[11px]',
        lg: 'h-12 rounded-2xl px-6 text-sm',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };
