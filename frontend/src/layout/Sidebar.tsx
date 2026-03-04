import { useState } from 'react';
import {
    Info,
    PanelLeftClose,
    PanelLeftOpen,
    Plus,
    RefreshCcw,
    Save,
} from 'lucide-react';
import { Button as NavButton } from '../components/Button';
import { useADJState, useADJActions } from '../store/ADJStore';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { cn } from '../lib/utils';
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
    const [collapsed, setSidebarCollapsed] = useState(false);

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

    const handleCollapse = () => {
        setSidebarCollapsed(!collapsed);
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
        <section
            className={cn(
                'border-border bg-muted/40 flex h-full shrink-0 flex-col border-r py-5 transition-[width,padding] duration-300',
                collapsed ? 'w-16 px-2' : 'w-72 px-4',
            )}
        >
            <div
                className={cn(
                    'flex',
                    collapsed
                        ? 'flex-col items-center gap-2'
                        : 'items-center justify-between',
                )}
            >
                <div className="flex items-center gap-3">
                    <img src={logo} alt="ADJ Valet" className="h-10 w-10" />
                    {!collapsed && (
                        <div>
                            <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
                                ADJ Valet
                            </p>
                            <p className="text-sm font-semibold">Workspace</p>
                        </div>
                    )}
                </div>
                <div className={cn('flex items-center gap-2', collapsed && 'flex-col')}>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCollapse}
                        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    >
                        {collapsed ? (
                            <PanelLeftOpen className="h-4 w-4" />
                        ) : (
                            <PanelLeftClose className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleReset}
                        title="Reset Application"
                    >
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {collapsed ? (
                <>
                    <div className="mt-4 flex flex-1 flex-col items-center gap-2 overflow-y-auto">
                        <Button
                            variant={
                                selectedSection === 'general_info'
                                    ? 'secondary'
                                    : 'ghost'
                            }
                            size="icon"
                            title="General Info"
                            onClick={() => onSelectedSection('general_info')}
                        >
                            <Info className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleAddBoard}
                            title="Add New Board"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Separator className="my-1" />
                        {config.boards.map((board, index) => {
                            const boardName = Object.keys(board)[0];
                            const boardInfo = Object.values(board)[0];

                            return (
                                <Button
                                    key={index}
                                    variant={
                                        selectedSection === boardName
                                            ? 'secondary'
                                            : 'ghost'
                                    }
                                    size="icon"
                                    title={`${boardName} (ID ${boardInfo.board_id})`}
                                    className="text-xs font-semibold"
                                    onClick={() => onSelectedSection(boardName)}
                                >
                                    {boardInfo.board_id}
                                </Button>
                            );
                        })}
                    </div>

                    <Button
                        className="mt-4 w-full"
                        size="icon"
                        onClick={handleSave}
                        disabled={isLoading}
                        title="Save Changes"
                    >
                        {isLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                    </Button>
                </>
            ) : (
                <>
                    <div className="mt-4 flex items-center gap-2">
                        <Badge variant="secondary">Config</Badge>
                        <Badge variant="outline">
                            {config.boards.length} boards
                        </Badge>
                    </div>

                    {displayError && (
                        <div className="border-destructive/30 bg-destructive/10 text-destructive mt-4 rounded-lg border px-3 py-2 text-xs">
                            {displayError}
                        </div>
                    )}

                    {saveSuccess && (
                        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                            Configuration saved successfully!
                        </div>
                    )}

                    <div className="mt-6 space-y-2">
                        <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
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
                                                    <div className="text-foreground font-medium">
                                                        {boardName}
                                                    </div>
                                                    <div className="text-muted-foreground text-xs">
                                                        ID {boardInfo.board_id}
                                                    </div>
                                                </div>
                                            }
                                            isSelected={
                                                selectedSection === boardName
                                            }
                                            onClick={() =>
                                                onSelectedSection(boardName)
                                            }
                                        />
                                    </li>
                                );
                            })}
                        </ul>

                        {config.boards.length === 0 && (
                            <div className="border-border text-muted-foreground rounded-lg border border-dashed p-4 text-center text-xs">
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
                </>
            )}
        </section>
    );
};
