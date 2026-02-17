import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground',
                secondary: 'bg-secondary text-secondary-foreground',
                outline: 'border border-border text-foreground',
                success: 'bg-emerald-100 text-emerald-900',
                warning: 'bg-amber-100 text-amber-900',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps) => (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
);
