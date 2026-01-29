import React, { useEffect, useRef, useId } from 'react';

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
    const closeBtnRef = useRef<HTMLButtonElement | null>(null);
    const deleteBtnRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        // Focus close button for accessibility
        setTimeout(() => closeBtnRef.current?.focus(), 0);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={onClose}
        >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white"
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
            >
                <header className="flex items-center justify-between border-b border-black/10 px-6 py-4">
                    {title ? (
                        <h3
                            id={titleId}
                            className="text-2xl font-semibold text-zinc-800"
                        >
                            {title}
                        </h3>
                    ) : (
                        <div />
                    )}

                    <div className="flex items-center gap-2">
                        {onDelete && (
                            <button
                                ref={deleteBtnRef}
                                onClick={onDelete}
                                aria-label={deleteLabel || 'Delete'}
                                title={deleteLabel || 'Delete'}
                                className="inline-flex items-center justify-center h-11 min-w-[52px] rounded-md px-3 py-2 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200 transition-colors"
                            >
                                <i className="fa-solid fa-trash text-lg" />
                            </button>
                        )}

                        <button
                            ref={closeBtnRef}
                            onClick={onClose}
                            aria-label="Close"
                            className="inline-flex items-center justify-center h-11 min-w-[52px] rounded-md px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
                        >
                            <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>
                </header>

                <div className="max-h-[72vh] overflow-auto p-6">{children}</div>

                {footer && (
                    <footer className="flex items-center justify-end gap-2 border-t px-6 py-3">
                        {footer}
                    </footer>
                )}
            </div>
        </div>
    );
};
