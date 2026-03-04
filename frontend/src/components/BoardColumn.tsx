import { ReactNode } from 'react';
import { LucideIcon, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface Props {
    title: string;
    icon: LucideIcon;
    onAdd: () => void;
    children: ReactNode;
    emptyState: ReactNode;
    hasItems: boolean;
}

export const BoardColumn = ({
    title,
    icon: Icon,
    onAdd,
    children,
    emptyState,
    hasItems,
}: Props) => {
    return (
        <Card className="max-h-[calc(100vh-8rem)] overflow-hidden">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {title}
                </CardTitle>
                <Button variant="outline" size="icon" onClick={onAdd}>
                    <Plus className="h-4 w-4" />
                </Button>
            </CardHeader>

            <CardContent className="space-y-3 overflow-y-auto pb-4">
                {hasItems ? children : emptyState}
            </CardContent>
        </Card>
    );
};
