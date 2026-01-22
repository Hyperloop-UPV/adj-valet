import { useADJState, useADJActions } from '../store/ADJStore';
import { BoardInfo, BoardName } from '../types/Board';
import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { SimpleMeasurementForm } from './SimpleMeasurementForm';
import { SimplePacketForm } from './SimplePacketForm';
import { Measurement } from '../types/Measurement';
import { Packet } from '../types/Packet';
import { Socket } from '../types/Socket';
import { SocketForm } from './SocketForm';

interface Props {
    boardName: BoardName;
    boardInfo: BoardInfo;
    setSelectedSection: (section: string) => void;
}

export const SimpleBoardForm = ({ boardName, boardInfo, setSelectedSection }: Props) => {
    const { config } = useADJState();
    const { updateBoard } = useADJActions();
    
    // Get the current board info directly from the store instead of relying on props
    const currentBoardInfo = config?.boards.find(
        board => Object.keys(board)[0] === boardName
    )?.[boardName] || boardInfo;
    
    const [localBoardInfo, setLocalBoardInfo] = useState(currentBoardInfo);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState(boardName);
    
    // Modal states
    const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
    const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null);
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
        setLocalBoardInfo(prev => ({ ...prev, [field]: newValue }));
        updateBoard(boardName, field, newValue);
    };

    const handleNameSave = () => {
        if (editName !== boardName && editName.trim()) {
            // TODO: Implement board renaming in the store
            console.log('Renaming board from', boardName, 'to', editName);
            // For now, just update the UI to show the new name would work
            setSelectedSection(editName);
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
            warningRange: [0, 100]
        };
        setSelectedMeasurement(newMeasurement);
        setIsMeasurementModalOpen(true);
    };

    const handleAddPacket = () => {
        const newPacket: Packet = {
            id: Date.now(),
            type: 'data',
            name: 'New Packet',
            variables: []
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
            port: 0
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

    return (
        <div className="w-full h-full flex flex-col">
            {/* Header with board name */}
            <div className="flex items-center gap-4 mb-6 px-6 pt-6">
                {isEditingName ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="text-2xl font-bold border-b-2 border-blue-500 focus:outline-none bg-transparent"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleNameSave();
                                if (e.key === 'Escape') handleNameCancel();
                            }}
                            autoFocus
                        />
                        <button
                            onClick={handleNameSave}
                            className="text-green-600 hover:text-green-800"
                        >
                            <i className="fa-solid fa-check"></i>
                        </button>
                        <button
                            onClick={handleNameCancel}
                            className="text-red-600 hover:text-red-800"
                        >
                            <i className="fa-solid fa-times"></i>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-gray-800">Board: {boardName}</h1>
                        <button
                            onClick={() => setIsEditingName(true)}
                            className="text-gray-500 hover:text-blue-600 p-1"
                            title="Rename board"
                        >
                            <i className="fa-solid fa-edit"></i>
                        </button>
                    </div>
                )}
            </div>

            {/* Four-column layout */}
            <div className="flex-1 grid grid-cols-4 gap-6 px-6 pb-6">
                {/* General Information Column */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-info-circle text-blue-600"></i>
                        General Information
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Board ID
                            </label>
                            <input
                                type="number"
                                value={localBoardInfo.board_id}
                                onChange={(e) => handleUpdate('board_id', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Board IP Address
                            </label>
                            <input
                                type="text"
                                value={localBoardInfo.board_ip}
                                onChange={(e) => handleUpdate('board_ip', e.target.value)}
                                placeholder="192.168.1.100"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        <div className="pt-4 border-t">
                            <div className="bg-gray-50 rounded-md p-3">
                                <div className="text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Measurements:</span>
                                        <span className="font-medium">{localBoardInfo.measurements.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Packets:</span>
                                        <span className="font-medium">{localBoardInfo.packets.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Sockets:</span>
                                        <span className="font-medium">{(localBoardInfo.sockets || []).length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Measurements Column */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <i className="fa-solid fa-chart-line text-blue-600"></i>
                            Measurements
                        </h2>
                        <button
                            onClick={handleAddMeasurement}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-1"
                        >
                            <i className="fa-solid fa-plus"></i>
                            Add
                        </button>
                    </div>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {localBoardInfo.measurements.length > 0 ? (
                            localBoardInfo.measurements.map((measurement, index) => (
                                <div 
                                    key={index} 
                                    className="flex justify-between items-center bg-blue-50 p-3 rounded cursor-pointer hover:bg-blue-100 transition-colors border border-blue-200"
                                    onClick={() => handleMeasurementClick(measurement)}
                                >
                                    <div>
                                        <div className="font-medium text-blue-800">{measurement.name}</div>
                                        <div className="text-xs text-gray-500">Type: {measurement.type}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-600">ID: {measurement.id}</div>
                                        <div className="text-xs text-gray-400">
                                            {measurement.displayUnits || 'No units'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <i className="fa-solid fa-chart-line text-4xl text-gray-300 mb-2"></i>
                                <p>No measurements configured</p>
                                <p className="text-sm">Click "Add" to create your first measurement</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Packets Column */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <i className="fa-solid fa-network-wired text-green-600"></i>
                            Packets
                        </h2>
                        <button
                            onClick={handleAddPacket}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-1"
                        >
                            <i className="fa-solid fa-plus"></i>
                            Add
                        </button>
                    </div>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {localBoardInfo.packets.length > 0 ? (
                            localBoardInfo.packets.map((packet, index) => (
                                <div 
                                    key={index} 
                                    className="flex justify-between items-center bg-green-50 p-3 rounded cursor-pointer hover:bg-green-100 transition-colors border border-green-200"
                                    onClick={() => handlePacketClick(packet)}
                                >
                                    <div>
                                        <div className="font-medium text-green-800">{packet.name}</div>
                                        <div className="text-xs text-gray-500">Type: {packet.type}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-600">
                                            {packet.id ? `ID: ${packet.id}` : 'No ID'}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {packet.variables.length} variables
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <i className="fa-solid fa-network-wired text-4xl text-gray-300 mb-2"></i>
                                <p>No packets configured</p>
                                <p className="text-sm">Click "Add" to create your first packet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sockets Column */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <i className="fa-solid fa-plug text-emerald-600"></i>
                            Sockets
                        </h2>
                        <button
                            onClick={handleAddSocket}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-1"
                        >
                            <i className="fa-solid fa-plus"></i>
                            Add
                        </button>
                    </div>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {(localBoardInfo.sockets || []).length > 0 ? (
                            (localBoardInfo.sockets || []).map((socket, index) => (
                                <div 
                                    key={index} 
                                    className="flex justify-between items-center bg-emerald-50 p-3 rounded cursor-pointer hover:bg-emerald-100 transition-colors border border-emerald-200"
                                    onClick={() => handleSocketClick(socket)}
                                >
                                    <div>
                                        <div className="font-medium text-emerald-800">{socket.name}</div>
                                        <div className="text-xs text-gray-500">Type: {socket.type}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-600">
                                            {socket.port ? `Port: ${socket.port}` : socket.local_port ? `Local: ${socket.local_port}` : ''}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {socket.remote_ip || ''}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <i className="fa-solid fa-plug text-4xl text-gray-300 mb-2"></i>
                                <p>No sockets configured</p>
                                <p className="text-sm">Click "Add" to create your first socket</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Measurement Modal */}
            <Modal isOpen={isMeasurementModalOpen} onClose={closeModals}>
                {selectedMeasurement && (
                    <SimpleMeasurementForm
                        boardName={boardName}
                        measurement={selectedMeasurement}
                        isCreating={!localBoardInfo.measurements.some(m => m.id === selectedMeasurement.id)}
                        onSubmit={closeModals}
                    />
                )}
            </Modal>

            {/* Packet Modal */}
            <Modal isOpen={isPacketModalOpen} onClose={closeModals}>
                {selectedPacket && (
                    <SimplePacketForm
                        boardName={boardName}
                        packet={selectedPacket}
                        isCreating={!localBoardInfo.packets.some(p => 
                            (p.id && selectedPacket.id && p.id === selectedPacket.id) || 
                            (!p.id && !selectedPacket.id && p.name === selectedPacket.name)
                        )}
                        onSubmit={closeModals}
                    />
                )}
            </Modal>

            {/* Socket Modal */}
            <Modal isOpen={isSocketModalOpen} onClose={closeModals}>
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