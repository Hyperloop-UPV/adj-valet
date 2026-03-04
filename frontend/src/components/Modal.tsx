import React, { useId } from 'react';
import { Trash2, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string | React.ReactNode;
    footer?: React.ReactNode;
    onDelete?: () => void;
    deleteLabel?: string;
}

export const Modal = ({ isOpen, onClose, children, title, footer, onDelete, deleteLabel }: Props) => {
    const titleId = useId();

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                aria-labelledby={title ? titleId : undefined}
                className="max-h-[90vh] overflow-hidden"
            >
                <DialogHeader className="mb-4 flex-row items-center justify-between">
                    {title ? (
                        <DialogTitle id={titleId}>{title}</DialogTitle>
                    ) : (
                        <div />
                    )}
                    <div className="flex items-center gap-2">
                        {onDelete && (
                            <Button
                                variant="destructive"
                                size="icon"
                                aria-label={deleteLabel || 'Delete'}
                                title={deleteLabel || 'Delete'}
                                onClick={onDelete}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="icon"
                            aria-label="Close"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="max-h-[72vh] overflow-auto pr-2">{children}</div>

                {footer && (
                    <footer className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
                        {footer}
                    </footer>
                )}
            </DialogContent>
        </Dialog>
    );
};
