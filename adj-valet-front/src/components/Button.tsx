
import { cn } from '../lib/utils';

interface Props {
    title: string | React.ReactNode;
    isSelected?: boolean;
    onClick?: () => void;
    className?: string;
}

export const Button = ({ title, isSelected, onClick, className }: Props) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-left text-sm font-medium transition-all',
            'hover:bg-muted/80',
            isSelected
                ? 'border-border bg-card shadow-sm'
                : 'text-muted-foreground',
            className,
        )}
    >
        <span
            className={cn(
                'h-2 w-2 rounded-full',
                isSelected ? 'bg-primary' : 'bg-muted-foreground/40',
            )}
        />
        <span className={cn('flex-1', isSelected && 'text-foreground')}>
            {title}
        </span>
    </button>
);
