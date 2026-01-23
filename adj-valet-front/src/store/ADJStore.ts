import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ADJ } from '../types/ADJ';
import { Board, BoardInfo, BoardName } from '../types/Board';
import { Measurement } from '../types/Measurement';
import { Packet } from '../types/Packet';
import { Socket } from '../types/Socket';
import { apiClient } from '../api/api';

export interface AppState {
    isLoading: boolean;
    error: string | null;
    adjPath: string | null;
    config: ADJ | null;
}

export interface AppActions {
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setADJPath: (path: string) => void;
    setConfig: (config: ADJ) => void;
    resetState: () => void;

    loadConfig: (path?: string) => Promise<void>;
    saveConfig: () => Promise<void>;

    updateBoard: (
        boardName: BoardName,
        field: keyof BoardInfo,
        value: unknown,
    ) => void;
    addBoard: (boardName: BoardName, boardInfo: BoardInfo) => void;
    removeBoard: (boardName: BoardName) => void;

    addMeasurement: (boardName: BoardName, measurement: Measurement) => void;
    updateMeasurement: (
        boardName: BoardName,
        measurementId: string,
        field: keyof Measurement,
        value: unknown,
    ) => void;
    removeMeasurement: (boardName: BoardName, measurementId: string) => void;

    addPacket: (boardName: BoardName, packet: Packet) => void;
    updatePacket: (
        boardName: BoardName,
        packetId: string,
        field: keyof Packet,
        value: unknown,
    ) => void;
    removePacket: (boardName: BoardName, packetId: string) => void;

    addSocket: (boardName: BoardName, socket: Socket) => void;
    updateSocket: (
        boardName: BoardName,
        socketName: string,
        field: keyof Socket,
        value: unknown,
    ) => void;
    removeSocket: (boardName: BoardName, socketName: string) => void;

    updateGeneralInfo: (section: string, key: string, value: unknown) => void;
    addGeneralInfoField: (section: string, key?: string) => void;
    removeGeneralInfoField: (section: string, key: string) => void;
}

type ADJStore = AppState & AppActions;

const initialState: AppState = {
    isLoading: false,
    error: null,
    adjPath: localStorage.getItem('adj_path'),
    config: null,
};

const findBoardIndex = (boards: Board[], boardName: BoardName): number => {
    return boards.findIndex((board) => Object.keys(board)[0] === boardName);
};

const getBoardFromEntry = (
    board: Board,
    boardName: BoardName,
): BoardInfo | undefined => {
    return board[boardName];
};

export const useADJStore = create<ADJStore>()(
    devtools(
        subscribeWithSelector(
            immer((set, get) => ({
                ...initialState,

                setLoading: (loading: boolean) =>
                    set((state) => {
                        state.isLoading = loading;
                    }),

                setError: (error: string | null) =>
                    set((state) => {
                        state.error = error;
                    }),

                setADJPath: (path: string) =>
                    set((state) => {
                        state.adjPath = path;
                        state.error = null; // Clear any previous errors when setting new path
                        localStorage.setItem('adj_path', path);
                    }),

                setConfig: (config: ADJ) =>
                    set((state) => {
                        state.config = config;
                        state.error = null;
                    }),

                resetState: () =>
                    set((state) => {
                        state.isLoading = false;
                        state.error = null;
                        state.adjPath = null;
                        state.config = null;
                        localStorage.removeItem('adj_path');
                    }),

                loadConfig: async (path?: string) => {
                    const { setLoading, setError, setADJPath, setConfig } =
                        get();
                    const adjPath = path || get().adjPath;

                    console.log(
                        'loadConfig called with path:',
                        path,
                        'adjPath:',
                        adjPath,
                    );

                    setLoading(true);
                    setError(null);

                    // Clear any existing config when loading new one
                    if (path) {
                        set((state) => {
                            state.config = null;
                        });
                        // Force API client to rediscover backend
                        apiClient.resetConnection();
                    }

                    try {
                        // If we have a path, always set it first to ensure backend loads fresh data
                        if (adjPath) {
                            console.log('Setting ADJ path:', adjPath);
                            await apiClient.setADJPath(adjPath);
                            setADJPath(adjPath);
                        } else {
                            setError('No ADJ path provided');
                            return;
                        }

                        console.log('Getting config from backend...');
                        const config = await apiClient.getConfig();

                        console.log('Config loaded successfully:', config);
                        setConfig(config);
                    } catch (error) {
                        const message =
                            error instanceof Error
                                ? error.message
                                : 'Failed to load configuration';
                        console.error(
                            'Failed to load ADJ configuration:',
                            error,
                        );
                        setError(message);
                    } finally {
                        setLoading(false);
                    }
                },

                saveConfig: async () => {
                    const { config, setLoading, setError } = get();

                    if (!config) {
                        setError('No configuration to save');
                        return;
                    }

                    setLoading(true);
                    setError(null);

                    try {
                        const updatedConfig =
                            await apiClient.updateConfig(config);
                        set((state) => {
                            state.config = updatedConfig;
                        });
                    } catch (error) {
                        const message =
                            error instanceof Error
                                ? error.message
                                : 'Failed to save configuration';
                        setError(message);
                        console.error(
                            'Failed to save ADJ configuration:',
                            error,
                        );
                    } finally {
                        setLoading(false);
                    }
                },

                updateBoard: (
                    boardName: BoardName,
                    field: keyof BoardInfo,
                    value: unknown,
                ) =>
                    set((state) => {
                        if (!state.config) return;

                        const boardIndex = findBoardIndex(
                            state.config.boards,
                            boardName,
                        );
                        if (boardIndex === -1) return;

                        const boardInfo = getBoardFromEntry(
                            state.config.boards[boardIndex],
                            boardName,
                        );
                        if (!boardInfo) return;

                        (boardInfo as Record<string, unknown>)[field] = value;
                    }),

                addBoard: (boardName: BoardName, boardInfo: BoardInfo) =>
                    set((state) => {
                        if (!state.config) return;

                        const existingIndex = findBoardIndex(
                            state.config.boards,
                            boardName,
                        );
                        if (existingIndex !== -1) return;

                        state.config.boards.push({ [boardName]: boardInfo });
                        state.config.board_list[boardName] =
                            `boards/${boardName}/${boardName}.json`;
                    }),

                removeBoard: (boardName: BoardName) =>
                    set((state) => {
                        if (!state.config) return;

                        const boardIndex = findBoardIndex(
                            state.config.boards,
                            boardName,
                        );
                        if (boardIndex === -1) return;

                        state.config.boards.splice(boardIndex, 1);
                        delete state.config.board_list[boardName];
                    }),

                addMeasurement: (
                    boardName: BoardName,
                    measurement: Measurement,
                ) =>
                    set((state) => {
                        if (!state.config) return;

                        const boardIndex = findBoardIndex(
                            state.config.boards,
                            boardName,
                        );
                        if (boardIndex === -1) return;

                        const boardInfo = getBoardFromEntry(
                            state.config.boards[boardIndex],
                            boardName,
                        );
                        if (!boardInfo) return;

                        boardInfo.measurements.push(measurement);
                    }),

                updateMeasurement: (
                    boardName: BoardName,
                    measurementId: string,
                    field: keyof Measurement,
                    value: unknown,
                ) =>
                    set((state) => {
                        if (!state.config) return;

                        const boardIndex = findBoardIndex(
                            state.config.boards,
                            boardName,
                        );
                        if (boardIndex === -1) return;

                        const boardInfo = getBoardFromEntry(
                            state.config.boards[boardIndex],
                            boardName,
                        );
                        if (!boardInfo) return;

                        const measurementIndex =
                            boardInfo.measurements.findIndex(
                                (m) => m.id === measurementId,
                            );
                        if (measurementIndex === -1) return;

                        (
                            boardInfo.measurements[measurementIndex] as Record<
                                string,
                                unknown
                            >
                        )[field] = value;
                    }),

                removeMeasurement: (
                    boardName: BoardName,
                    measurementId: string,
                ) =>
                    set((state) => {
                        if (!state.config) return;

                        const boardIndex = findBoardIndex(
                            state.config.boards,
                            boardName,
                        );
                        if (boardIndex === -1) return;

                        const boardInfo = getBoardFromEntry(
                            state.config.boards[boardIndex],
                            boardName,
                        );
                        if (!boardInfo) return;

                        const measurementIndex =
                            boardInfo.measurements.findIndex(
                                (m) => m.id === measurementId,
                            );
                        if (measurementIndex !== -1) {
                            boardInfo.measurements.splice(measurementIndex, 1);
                        }
                    }),

                addPacket: (boardName: BoardName, packet: Packet) =>
                    set((state) => {
                        if (!state.config) return;

                        const boardIndex = findBoardIndex(
                            state.config.boards,
                            boardName,
                        );
                        if (boardIndex === -1) return;

                        const boardInfo = getBoardFromEntry(
                            state.config.boards[boardIndex],
                            boardName,
                        );
                        if (!boardInfo) return;

                        boardInfo.packets.push(packet);
                    }),

                updatePacket: (
                    boardName: BoardName,
                    packetId: string,
                    field: keyof Packet,
                    value: unknown,
                ) =>
                    set((state) => {
                        if (!state.config) return;

                        const boardIndex = findBoardIndex(
                            state.config.boards,
                            boardName,
                        );
                        if (boardIndex === -1) return;

                        const boardInfo = getBoardFromEntry(
                            state.config.boards[boardIndex],
                            boardName,
                        );
                        if (!boardInfo) return;

                        const packetIndex = boardInfo.packets.findIndex(
                            (p) =>
                                (p.id && p.id.toString() === packetId) ||
                                p.name === packetId,
                        );
                        if (packetIndex === -1) return;

                        (
                            boardInfo.packets[packetIndex] as Record<
                                string,
                                unknown
                            >
                        )[field] = value;
                    }),

                removePacket: (boardName: BoardName, packetId: string) =>
                    set((state) => {
                        if (!state.config) return;

                        const boardIndex = findBoardIndex(
                            state.config.boards,
                            boardName,
                        );
                        if (boardIndex === -1) return;

                        const boardInfo = getBoardFromEntry(
                            state.config.boards[boardIndex],
                            boardName,
                        );
                        if (!boardInfo) return;

                        const packetIndex = boardInfo.packets.findIndex(
                            (p) =>
                                (p.id && p.id.toString() === packetId) ||
                                p.name === packetId,
                        );
                        if (packetIndex !== -1) {
                            boardInfo.packets.splice(packetIndex, 1);
                        }
                    }),

                addSocket: (boardName: BoardName, socket: Socket) =>
                    set((state) => {
                        if (!state.config) return;

                        const boardIndex = findBoardIndex(
                            state.config.boards,
                            boardName,
                        );
                        if (boardIndex === -1) return;

                        const boardInfo = getBoardFromEntry(
                            state.config.boards[boardIndex],
                            boardName,
                        );
                        if (!boardInfo) return;

                        if (!boardInfo.sockets) {
                            boardInfo.sockets = [];
                        }
                        boardInfo.sockets.push(socket);
                    }),

                updateSocket: (
                    boardName: BoardName,
                    socketName: string,
                    field: keyof Socket,
                    value: unknown,
                ) =>
                    set((state) => {
                        if (!state.config) return;

                        const boardIndex = findBoardIndex(
                            state.config.boards,
                            boardName,
                        );
                        if (boardIndex === -1) return;

                        const boardInfo = getBoardFromEntry(
                            state.config.boards[boardIndex],
                            boardName,
                        );
                        if (!boardInfo || !boardInfo.sockets) return;

                        const socketIndex = boardInfo.sockets.findIndex(
                            (s) => s.name === socketName,
                        );
                        if (socketIndex === -1) return;

                        (
                            boardInfo.sockets[socketIndex] as Record<
                                string,
                                unknown
                            >
                        )[field] = value;
                    }),

                removeSocket: (boardName: BoardName, socketName: string) =>
                    set((state) => {
                        if (!state.config) return;

                        const boardIndex = findBoardIndex(
                            state.config.boards,
                            boardName,
                        );
                        if (boardIndex === -1) return;

                        const boardInfo = getBoardFromEntry(
                            state.config.boards[boardIndex],
                            boardName,
                        );
                        if (!boardInfo || !boardInfo.sockets) return;

                        const socketIndex = boardInfo.sockets.findIndex(
                            (s) => s.name === socketName,
                        );
                        if (socketIndex !== -1) {
                            boardInfo.sockets.splice(socketIndex, 1);
                        }
                    }),

                updateGeneralInfo: (
                    section: string,
                    key: string,
                    value: unknown,
                ) =>
                    set((state) => {
                        if (!state.config?.general_info) return;

                        const sectionData = state.config.general_info[
                            section
                        ] as Record<string, unknown>;
                        if (sectionData && typeof sectionData === 'object') {
                            // Convert string numbers to actual numbers for ports and message_ids
                            if (
                                (section === 'ports' ||
                                    section === 'message_ids') &&
                                typeof value === 'string'
                            ) {
                                const numValue = Number(value);
                                if (!isNaN(numValue)) {
                                    sectionData[key] = numValue;
                                    return;
                                }
                            }
                            sectionData[key] = value;
                        }
                    }),

                addGeneralInfoField: (section: string, key?: string) =>
                    set((state) => {
                        if (!state.config?.general_info) return;

                        let sectionData = state.config.general_info[
                            section
                        ] as Record<string, unknown>;
                        if (!sectionData || typeof sectionData !== 'object') {
                            sectionData = {};
                            state.config.general_info[section] = sectionData;
                        }

                        let newKey = key || 'new_field';
                        let counter = 1;
                        while (newKey in sectionData) {
                            newKey = `${key || 'new_field'}_${counter++}`;
                        }

                        sectionData[newKey] = '';
                    }),

                removeGeneralInfoField: (section: string, key: string) =>
                    set((state) => {
                        if (!state.config?.general_info) return;

                        const sectionData = state.config.general_info[
                            section
                        ] as Record<string, unknown>;
                        if (sectionData && typeof sectionData === 'object') {
                            delete sectionData[key];
                        }
                    }),
            })),
        ),
        {
            name: 'adj-store',
        },
    ),
);

export const useADJActions = () => {
    const {
        setLoading,
        setError,
        setADJPath,
        setConfig,
        resetState,
        loadConfig,
        saveConfig,
        updateBoard,
        addBoard,
        removeBoard,
        addMeasurement,
        updateMeasurement,
        removeMeasurement,
        addPacket,
        updatePacket,
        removePacket,
        addSocket,
        updateSocket,
        removeSocket,
        updateGeneralInfo,
        addGeneralInfoField,
        removeGeneralInfoField,
    } = useADJStore();

    return {
        setLoading,
        setError,
        setADJPath,
        setConfig,
        resetState,
        loadConfig,
        saveConfig,
        updateBoard,
        addBoard,
        removeBoard,
        addMeasurement,
        updateMeasurement,
        removeMeasurement,
        addPacket,
        updatePacket,
        removePacket,
        addSocket,
        updateSocket,
        removeSocket,
        updateGeneralInfo,
        addGeneralInfoField,
        removeGeneralInfoField,
    };
};

export const useADJState = () => {
    const { isLoading, error, adjPath, config } = useADJStore();
    return { isLoading, error, adjPath, config };
};
