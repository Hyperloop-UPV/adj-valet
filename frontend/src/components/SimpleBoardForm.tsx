import { useADJState, useADJActions } from '../store/ADJStore';
import { BoardInfo, BoardName } from '../types/Board';
import { useState, useEffect } from 'react';
import { Edit2, Trash2, Activity, Network, Plug, Hash } from 'lucide-react';
import { Modal } from './Modal';
import { SimpleMeasurementForm } from './SimpleMeasurementForm';
import { SimplePacketForm } from './SimplePacketForm';
import { Measurement } from '../types/Measurement';
import { Packet } from '../types/Packet';
import { Socket } from '../types/Socket';
import { SocketForm } from './SocketForm';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { BoardColumn } from './BoardColumn';

interface Props {
    boardName: BoardName;
    boardInfo: BoardInfo;
    setSelectedSection: (section: string) => void;
}

export const SimpleBoardForm = ({
    boardName,
    boardInfo,
    setSelectedSection,
}: Props) => {
    const { config } = useADJState();
    const {
        updateBoard,
        addBoard,
        removeBoard,
        removeMeasurement,
        removePacket,
        removeSocket,
    } = useADJActions();

    // Get the current board info directly from the store instead of relying on props
    const currentBoardInfo =
        config?.boards.find((board) => Object.keys(board)[0] === boardName)?.[
            boardName
        ] || boardInfo;

    const [localBoardInfo, setLocalBoardInfo] = useState(currentBoardInfo);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState(boardName);

    // Modal states
    const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
    const [selectedMeasurement, setSelectedMeasurement] =
        useState<Measurement | null>(null);
    const [isPacketModalOpen, setIsPacketModalOpen] = useState(false);
    const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null);
    const [isSocketModalOpen, setIsSocketModalOpen] = useState(false);
    const [selectedSocket, setSelectedSocket] = useState<Socket | null>(null);

    // Update local board info when the store changes
    useEffect(() => {
        setLocalBoardInfo(currentBoardInfo);
    }, [currentBoardInfo, boardName]);

    if (!config) {
        return <div>No configuration loaded</div>;
    }

    const handleUpdate = (field: keyof BoardInfo, value: string | number) => {
        const newValue = field === 'board_id' ? Number(value) : value;
        setLocalBoardInfo((prev) => ({ ...prev, [field]: newValue }));
        updateBoard(boardName, field, newValue);
    };

    const handleNameSave = () => {
        const trimmed = editName.trim();
        if (trimmed === '') {
            setEditName(boardName);
            setIsEditingName(false);
            return;
        }

        if (trimmed !== boardName) {
            const exists = config?.boards.some(
                (b) => Object.keys(b)[0] === trimmed,
            );
            if (exists) {
                alert(
                    'A board with this name already exists. Please choose a different name.',
                );
                setEditName(boardName);
                setIsEditingName(false);
                return;
            }

            removeBoard(boardName);
            addBoard(trimmed, localBoardInfo);
            setSelectedSection(trimmed);
        }

        setIsEditingName(false);
    };

    const handleNameCancel = () => {
        setEditName(boardName);
        setIsEditingName(false);
    };

    const handleMeasurementClick = (measurement: Measurement) => {
        setSelectedMeasurement(measurement);
        setIsMeasurementModalOpen(true);
    };

    const handlePacketClick = (packet: Packet) => {
        setSelectedPacket(packet);
        setIsPacketModalOpen(true);
    };

    const handleAddMeasurement = () => {
        const newMeasurement: Measurement = {
            id: `measurement_${Date.now()}`,
            name: 'New Measurement',
            type: 'uint32',
            podUnits: '',
            displayUnits: '',
            enumValues: [],
            safeRange: [0, 100],
            warningRange: [0, 100],
        };
        setSelectedMeasurement(newMeasurement);
        setIsMeasurementModalOpen(true);
    };

    const handleAddPacket = () => {
        const newPacket: Packet = {
            id: Date.now(),
            type: 'data',
            name: 'New Packet',
            variables: [],
        };
        setSelectedPacket(newPacket);
        setIsPacketModalOpen(true);
    };

    const handleSocketClick = (socket: Socket) => {
        setSelectedSocket(socket);
        setIsSocketModalOpen(true);
    };

    const handleAddSocket = () => {
        const newSocket: Socket = {
            type: 'ServerSocket',
            name: '',
            port: 0,
        };
        setSelectedSocket(newSocket);
        setIsSocketModalOpen(true);
    };

    const closeModals = () => {
        setIsMeasurementModalOpen(false);
        setIsPacketModalOpen(false);
        setIsSocketModalOpen(false);
        setSelectedMeasurement(null);
        setSelectedPacket(null);
        setSelectedSocket(null);
    };

    const sockets = localBoardInfo.sockets || [];

    return (
        <div className="flex h-auto w-full flex-col">
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-6">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">Board</Badge>
                        <Badge variant="outline">
                            ID {localBoardInfo.board_id}
                        </Badge>
                    </div>
                    {isEditingName ? (
                        <div className="flex items-center gap-2">
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleNameSave();
                                    if (e.key === 'Escape') handleNameCancel();
                                }}
                                autoFocus
                                className="h-10 w-56"
                            />
                            <Button onClick={handleNameSave} size="sm">
                                Save
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNameCancel}
                            >
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <h1 className="text-2xl font-semibold">{boardName}</h1>
                    )}
                </div>

                {!isEditingName && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsEditingName(true)}
                            title="Rename board"
                        >
                            <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => removeBoard(boardName)}
                            title="Delete board"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 px-6 pb-8 xl:grid-cols-4">
                <Card className="max-h-[calc(100vh-8rem)] overflow-hidden">
                    <CardHeader className="flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Hash className="text-muted-foreground h-4 w-4" />
                            General
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 overflow-y-auto pb-4">
                        <div className="space-y-1">
                            <label className="text-muted-foreground text-xs">
                                Board ID
                            </label>
                            <Input
                                type="number"
                                value={localBoardInfo.board_id}
                                onChange={(e) =>
                                    handleUpdate('board_id', e.target.value)
                                }
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-muted-foreground text-xs">
                                Board IP Address
                            </label>
                            <Input
                                type="text"
                                value={localBoardInfo.board_ip}
                                onChange={(e) =>
                                    handleUpdate('board_ip', e.target.value)
                                }
                                placeholder="192.168.1.100"
                            />
                        </div>

                        <div className="border-border bg-muted/40 text-muted-foreground rounded-lg border p-3 text-xs">
                            <div className="flex justify-between">
                                <span>Measurements</span>
                                <span className="text-foreground font-semibold">
                                    {localBoardInfo.measurements.length}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Packets</span>
                                <span className="text-foreground font-semibold">
                                    {localBoardInfo.packets.length}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Sockets</span>
                                <span className="text-foreground font-semibold">
                                    {sockets.length}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <BoardColumn
                    title="Measurements"
                    icon={Activity}
                    onAdd={handleAddMeasurement}
                    hasItems={localBoardInfo.measurements.length > 0}
                    emptyState={
                        <div className="border-border text-muted-foreground rounded-lg border border-dashed p-6 text-center text-xs">
                            No measurements configured yet.
                        </div>
                    }
                >
                    {localBoardInfo.measurements.map((measurement, index) => (
                        <div
                            key={index}
                            className="border-border bg-muted/30 hover:bg-muted flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors"
                            onClick={() => handleMeasurementClick(measurement)}
                        >
                            <div>
                                <div className="text-sm font-semibold">
                                    {measurement.name}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                    Type {measurement.type}
                                </div>
                            </div>
                            <div className="text-muted-foreground text-right text-xs">
                                <div>ID {measurement.id}</div>
                                <div>
                                    {measurement.displayUnits || 'No units'}
                                </div>
                            </div>
                        </div>
                    ))}
                </BoardColumn>

                <BoardColumn
                    title="Packets"
                    icon={Network}
                    onAdd={handleAddPacket}
                    hasItems={localBoardInfo.packets.length > 0}
                    emptyState={
                        <div className="border-border text-muted-foreground rounded-lg border border-dashed p-6 text-center text-xs">
                            No packets configured yet.
                        </div>
                    }
                >
                    {localBoardInfo.packets.map((packet, index) => (
                        <div
                            key={index}
                            className="border-border bg-muted/30 hover:bg-muted flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors"
                            onClick={() => handlePacketClick(packet)}
                        >
                            <div>
                                <div className="text-sm font-semibold">
                                    {packet.name}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                    Type {packet.type}
                                </div>
                            </div>
                            <div className="text-muted-foreground text-right text-xs">
                                <div>
                                    {packet.id ? `ID ${packet.id}` : 'No ID'}
                                </div>
                                <div>{packet.variables.length} vars</div>
                            </div>
                        </div>
                    ))}
                </BoardColumn>

                <BoardColumn
                    title="Sockets"
                    icon={Plug}
                    onAdd={handleAddSocket}
                    hasItems={sockets.length > 0}
                    emptyState={
                        <div className="border-border text-muted-foreground rounded-lg border border-dashed p-6 text-center text-xs">
                            No sockets configured yet.
                        </div>
                    }
                >
                    {sockets.map((socket, index) => (
                        <div
                            key={index}
                            className="border-border bg-muted/30 hover:bg-muted flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors"
                            onClick={() => handleSocketClick(socket)}
                        >
                            <div>
                                <div className="text-sm font-semibold">
                                    {socket.name || 'Unnamed'}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                    Type {socket.type}
                                </div>
                            </div>
                            <div className="text-muted-foreground text-right text-xs">
                                <div>
                                    {socket.port
                                        ? `Port ${socket.port}`
                                        : socket.local_port
                                          ? `Local ${socket.local_port}`
                                          : ''}
                                </div>
                                <div>{socket.remote_ip || ''}</div>
                            </div>
                        </div>
                    ))}
                </BoardColumn>
            </div>

            {/* Measurement Modal */}
            <Modal
                isOpen={isMeasurementModalOpen}
                onClose={closeModals}
                title={selectedMeasurement?.name || 'Measurement'}
                onDelete={
                    selectedMeasurement &&
                    !localBoardInfo.measurements.some(
                        (m) => m.id === selectedMeasurement.id,
                    )
                        ? undefined
                        : () => {
                              if (!selectedMeasurement) return;
                              if (
                                  confirm(
                                      `Delete measurement ${selectedMeasurement.name}? This cannot be undone.`,
                                  )
                              ) {
                                  removeMeasurement(
                                      boardName,
                                      selectedMeasurement.id,
                                  );
                                  closeModals();
                              }
                          }
                }
                deleteLabel="Delete Measurement"
            >
                {selectedMeasurement && (
                    <SimpleMeasurementForm
                        boardName={boardName}
                        measurement={selectedMeasurement}
                        isCreating={
                            !localBoardInfo.measurements.some(
                                (m) => m.id === selectedMeasurement.id,
                            )
                        }
                        onSubmit={closeModals}
                    />
                )}
            </Modal>

            {/* Packet Modal */}
            <Modal
                isOpen={isPacketModalOpen}
                onClose={closeModals}
                title={selectedPacket?.name || 'Packet'}
                onDelete={
                    selectedPacket &&
                    !localBoardInfo.packets.some(
                        (p) =>
                            (p.id &&
                                selectedPacket.id &&
                                p.id === selectedPacket.id) ||
                            (!p.id &&
                                !selectedPacket.id &&
                                p.name === selectedPacket.name),
                    )
                        ? undefined
                        : () => {
                              if (!selectedPacket) return;
                              if (
                                  confirm(
                                      `Delete packet ${selectedPacket.name}? This cannot be undone.`,
                                  )
                              ) {
                                  removePacket(
                                      boardName,
                                      String(selectedPacket.id),
                                  );
                                  closeModals();
                              }
                          }
                }
                deleteLabel="Delete Packet"
            >
                {selectedPacket && (
                    <SimplePacketForm
                        boardName={boardName}
                        packet={selectedPacket}
                        isCreating={
                            !localBoardInfo.packets.some(
                                (p) =>
                                    (p.id &&
                                        selectedPacket.id &&
                                        p.id === selectedPacket.id) ||
                                    (!p.id &&
                                        !selectedPacket.id &&
                                        p.name === selectedPacket.name),
                            )
                        }
                        onSubmit={closeModals}
                    />
                )}
            </Modal>

            {/* Socket Modal */}
            <Modal
                isOpen={isSocketModalOpen}
                onClose={closeModals}
                title={selectedSocket?.name || 'Socket'}
                onDelete={
                    selectedSocket && selectedSocket.name === ''
                        ? undefined
                        : () => {
                              if (!selectedSocket) return;
                              if (
                                  confirm(
                                      `Delete socket ${selectedSocket.name}? This cannot be undone.`,
                                  )
                              ) {
                                  removeSocket(boardName, selectedSocket.name);
                                  closeModals();
                              }
                          }
                }
                deleteLabel="Delete Socket"
            >
                {selectedSocket && (
                    <SocketForm
                        boardName={boardName}
                        socket={selectedSocket}
                        isCreating={selectedSocket.name === ''}
                        onSubmit={closeModals}
                    />
                )}
            </Modal>
        </div>
    );
};
