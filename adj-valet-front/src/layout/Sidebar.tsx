import { useState } from 'react';
import { Button } from '../components/Button';
import { useADJState, useADJActions } from '../store/ADJStore';

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
        <section className="flex h-full w-64 flex-col justify-between gap-4 border-r-1 border-gray-300/30 bg-gray-100/30 p-2">
            <div className="flex flex-col gap-6">
                <div className="flex justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm text-black/70">
                        <img
                            src="./src/assets/monkey.svg"
                            alt="ADJ Valet Logo"
                            className="h-10 w-10"
                        />{' '}
                        ADJ<br></br>Valet
                    </span>
                    <button
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-orange-600 text-white transition-colors hover:bg-orange-700"
                        onClick={handleReset}
                        title="Reset Application"
                    >
                        <i className="fa-solid fa-refresh text-lg"></i>
                    </button>
                </div>

                {displayError && (
                    <div className="rounded border border-red-400 bg-red-100 px-3 py-2 text-sm text-red-700">
                        {displayError}
                    </div>
                )}

                {saveSuccess && (
                    <div className="rounded border border-green-400 bg-green-100 px-3 py-2 text-sm text-green-700">
                        Configuration saved successfully!
                    </div>
                )}

                <Button
                    title="General Info"
                    isSelected={selectedSection === 'general_info'}
                    onClick={() => onSelectedSection('general_info')}
                />
            </div>

            <div className="flex flex-col gap-4 overflow-scroll">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-black">Boards</h2>
                    <button
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-300 text-black transition-colors hover:bg-orange-500"
                        onClick={handleAddBoard}
                        title="Add New Board"
                    >
                        <i className="fa-solid fa-plus text-sm"></i>
                    </button>
                </div>

                <ul className="flex flex-col gap-2">
                    {config.boards.map((board, index) => {
                        const boardName = Object.keys(board)[0];
                        const boardInfo = Object.values(board)[0];

                        return (
                            <li key={index}>
                                <Button
                                    title={
                                        <div className="text-left">
                                            <div className="font-medium">
                                                {boardName}
                                            </div>
                                            <div className="text-xs opacity-75">
                                                ID: {boardInfo.board_id}
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
                    <div className="py-4 text-center text-sm text-white/60">
                        No boards configured. Click + to add one.
                    </div>
                )}

                <button
                    className={`flex h-10 w-full items-center justify-center rounded-full text-white transition-colors ${
                        isLoading
                            ? 'cursor-not-allowed bg-gray-500'
                            : 'cursor-pointer bg-green-600 hover:bg-green-700'
                    }`}
                    onClick={handleSave}
                    disabled={isLoading}
                    title="Save Configuration"
                >
                    {isLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                        <>
                            <i className="fa-solid fa-floppy-disk mr-4 text-lg"></i>{' '}
                            Save Changes
                        </>
                    )}
                </button>
            </div>
        </section>
    );
};
