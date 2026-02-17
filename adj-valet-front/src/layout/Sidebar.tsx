import { useState } from 'react';
import { Plus, RefreshCcw, Save } from 'lucide-react';
import { Button as NavButton } from '../components/Button';
import { useADJState, useADJActions } from '../store/ADJStore';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import logo from '../assets/logo.svg';

interface Props {
    selectedSection: string;
    onSelectedSection: (section: string) => void;
}

export const Sidebar = ({ selectedSection, onSelectedSection }: Props) => {
    const { config, isLoading, error } = useADJState();
    const { saveConfig, resetState, addBoard } = useADJActions();
    const [localError, setLocalError] = useState<string>('');
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

    const handleSave = async () => {
        try {
            setLocalError('');
            await saveConfig();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to save configuration';
            setLocalError(message);
            setTimeout(() => setLocalError(''), 3000);
        }
    };

    const handleReset = () => {
        if (
            confirm(
                'Are you sure you want to reset? This will clear the current ADJ path and reload the application.',
            )
        ) {
            resetState();
            window.location.reload();
        }
    };

    const handleAddBoard = () => {
        if (!config) return;

        const existingIds = config.boards.map((board) => {
            const boardInfo = Object.values(board)[0];
            return Number(boardInfo.board_id);
        });
        const nextId =
            existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

        let boardName = `Board${nextId}`;
        let counter = 1;
        while (
            config.boards.some((board) => Object.keys(board)[0] === boardName)
        ) {
            boardName = `Board${nextId}_${counter++}`;
        }

        addBoard(boardName, {
            board_id: nextId,
            board_ip: '192.168.1.100',
            packets: [],
            measurements: [],
            sockets: [],
        });

        onSelectedSection(boardName);
    };

    if (!config) {
        return null;
    }

    const displayError = localError || error;

    return (
        <section className="flex h-full w-72 flex-col border-r border-border bg-muted/40 px-4 py-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="ADJ Valet" className="h-10 w-10" />
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            ADJ Valet
                        </p>
                        <p className="text-sm font-semibold">Workspace</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleReset}
                    title="Reset Application"
                >
                    <RefreshCcw className="h-4 w-4" />
                </Button>
            </div>

            <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary">Config</Badge>
                <Badge variant="outline">{config.boards.length} boards</Badge>
            </div>

            {displayError && (
                <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {displayError}
                </div>
            )}

            {saveSuccess && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                    Configuration saved successfully!
                </div>
            )}

            <div className="mt-6 space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Navigation
                </p>
                <NavButton
                    title="General Info"
                    isSelected={selectedSection === 'general_info'}
                    onClick={() => onSelectedSection('general_info')}
                />
            </div>

            <Separator className="my-5" />

            <div className="flex flex-1 flex-col gap-3 overflow-hidden">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Boards</h2>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleAddBoard}
                        title="Add New Board"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                <ul className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
                    {config.boards.map((board, index) => {
                        const boardName = Object.keys(board)[0];
                        const boardInfo = Object.values(board)[0];

                        return (
                            <li key={index}>
                                <NavButton
                                    title={
                                        <div className="text-left">
                                            <div className="font-medium text-foreground">
                                                {boardName}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                ID {boardInfo.board_id}
                                            </div>
                                        </div>
                                    }
                                    isSelected={selectedSection === boardName}
                                    onClick={() => onSelectedSection(boardName)}
                                />
                            </li>
                        );
                    })}
                </ul>

                {config.boards.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                        No boards configured. Click + to add one.
                    </div>
                )}
            </div>

            <Button
                className="mt-4 w-full"
                onClick={handleSave}
                disabled={isLoading}
            >
                {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                    <span className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Changes
                    </span>
                )}
            </Button>
        </section>
    );
};
