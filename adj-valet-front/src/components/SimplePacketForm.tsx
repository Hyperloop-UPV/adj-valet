import { useState } from 'react';
import { useADJState, useADJActions } from '../store/ADJStore';
import { Packet } from '../types/Packet';
import { BoardName } from '../types/Board';
import { Measurement } from '../types/Measurement';

interface Props {
    boardName: BoardName;
    packet: Packet;
    isCreating: boolean;
    onSubmit: () => void;
}

export const SimplePacketForm = ({ boardName, packet, isCreating, onSubmit }: Props) => {
    const { config } = useADJState();
    const { addPacket, updatePacket, removePacket } = useADJActions();
    const [formData, setFormData] = useState<Packet>(packet);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVariables, setSelectedVariables] = useState<string[]>(packet.variables || []);

    // Get all measurements from all boards with board info
    const getAllMeasurements = (): Array<{ measurement: Measurement; boardName: string }> => {
        if (!config) return [];
        
        const measurementsWithBoard: Array<{ measurement: Measurement; boardName: string }> = [];
        config.boards.forEach(board => {
            const boardName = Object.keys(board)[0];
            const boardInfo = Object.values(board)[0];
            boardInfo.measurements.forEach(measurement => {
                measurementsWithBoard.push({ measurement, boardName });
            });
        });
        return measurementsWithBoard;
    };

    // Get available sockets from the current board
    const getAvailableSockets = () => {
        if (!config) return [];
        const board = config.boards.find(b => Object.keys(b)[0] === boardName);
        if (!board) return [];
        return board[boardName].sockets || [];
    };

    const allMeasurements = getAllMeasurements();
    const availableSockets = getAvailableSockets();
    
    // Filter measurements based on search term
    const filteredMeasurements = allMeasurements.filter(item =>
        item.measurement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.measurement.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.boardName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert('Name cannot be empty');
            return;
        }

        const updatedFormData = { ...formData, variables: selectedVariables };

        if (isCreating) {
            addPacket(boardName, updatedFormData);
        } else {
            // Update each field
            const packetId = packet.id?.toString() || packet.name;
            Object.keys(updatedFormData).forEach(key => {
                updatePacket(boardName, packetId, key as keyof Packet, updatedFormData[key as keyof Packet]);
            });
        }

        onSubmit();
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete packet "${packet.name}"?`)) {
            const packetId = packet.id?.toString() || packet.name;
            removePacket(boardName, packetId);
            onSubmit();
        }
    };

    const handleFieldChange = (field: keyof Packet, value: unknown) => {
        if (field === 'id' && typeof value === 'string') {
            const numValue = parseInt(value) || undefined;
            setFormData(prev => ({ ...prev, [field]: numValue }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const toggleVariable = (measurementId: string) => {
        setSelectedVariables(prev => {
            if (prev.includes(measurementId)) {
                return prev.filter(v => v !== measurementId);
            } else {
                return [...prev, measurementId];
            }
        });
    };

    const removeVariable = (variable: string) => {
        setSelectedVariables(prev => prev.filter(v => v !== variable));
    };

    return (
        <div className="p-4 pt-0 max-h-[80vh] flex flex-col">
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ID (optional)</label>
                        <input
                            type="number"
                            value={formData.id || ''}
                            onChange={(e) => handleFieldChange('id', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder="Leave empty for no ID"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                        value={formData.type}
                        onChange={(e) => handleFieldChange('type', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        <option value="data">Data (sensor readings, measurements)</option>
                        <option value="order">Order (commands, control instructions)</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Socket</label>
                        <select
                            value={formData.socket || ''}
                            onChange={(e) => handleFieldChange('socket', e.target.value || undefined)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        >
                            <option value="">None</option>
                            {availableSockets.map((socket) => (
                                <option key={socket.name} value={socket.name}>
                                    {socket.name} ({socket.type})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Assign this packet to a socket for network communication
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Period (ms)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.period_ms ?? ''}
                            onChange={(e) => handleFieldChange('period_ms', e.target.value ? parseFloat(e.target.value) : undefined)}
                            placeholder="e.g. 16.67"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Transmission period in milliseconds
                        </p>
                    </div>
                </div>

                <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Variables (Measurements)</label>
                    
                    {/* Selected Variables */}
                    {selectedVariables.length > 0 && (
                        <div className="mb-3">
                            <p className="text-xs text-gray-600 mb-1">Selected variables:</p>
                            <div className="flex flex-wrap gap-2">
                                {selectedVariables.map(variable => (
                                    <span key={variable} className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm">
                                        {variable}
                                        <button
                                            type="button"
                                            onClick={() => removeVariable(variable)}
                                            className="hover:text-green-600"
                                        >
                                            <i className="fa-solid fa-xmark text-xs"></i>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search Input */}
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search measurements..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />

                    {/* Scrollable Measurement List */}
                    <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto">
                        {filteredMeasurements.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                                {filteredMeasurements.map(({ measurement, boardName }) => {
                                    const isSelected = selectedVariables.includes(measurement.id);
                                    return (
                                        <label
                                            key={`${boardName}-${measurement.id}`}
                                            className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                                                isSelected ? 'bg-green-50' : ''
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleVariable(measurement.id)}
                                                className="mr-3 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{measurement.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    ID: {measurement.id} | Type: {measurement.type} | Board: {boardName}
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm p-3 text-center">
                                {searchTerm ? 'No measurements found' : 'No measurements available'}
                            </p>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Select measurements to include as variables in this packet
                    </p>
                </div>

            </form>

            <div className="flex justify-end gap-3 pt-4 bg-white flex-shrink-0">
                {!isCreating && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="inline-flex items-center justify-center h-11 min-w-[52px] rounded-md px-3 py-2 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200 transition-colors"
                    >
                        <i className="fa-solid fa-trash text-lg mr-2"></i> Delete
                    </button>
                )}

                <button
                    type="button"
                    onClick={onSubmit}
                    className="inline-flex items-center justify-center h-11 min-w-[52px] rounded-md px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    onClick={handleSubmit}
                    className="inline-flex items-center justify-center h-11 min-w-[52px] rounded-md px-3 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-colors"
                >
                    {isCreating ? 'Add Packet' : 'Update Packet'}
                </button>
            </div>
        </div>
    );
};