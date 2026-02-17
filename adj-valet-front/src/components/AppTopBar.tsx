import { Play, ShieldCheck, Square } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

export const AppTopBar = () => {
    return (
        <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-4">
            <div className="flex items-center gap-3">
                <Badge variant="success" className="gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Active
                </Badge>
                <Badge variant="outline" className="text-xs">
                    Logger Standby
                </Badge>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" title="Start">
                    <Play className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" title="Stop">
                    <Square className="h-4 w-4" />
                </Button>
            </div>
        </header>
    );
};
