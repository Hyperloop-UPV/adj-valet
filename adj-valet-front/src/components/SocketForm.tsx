import { useState } from 'react';
import { useADJActions, useADJState } from '../store/ADJStore';
import { Socket, SocketType } from '../types/Socket';
import { Input } from './Input';

interface Props {
    boardName: string;
    socket: Socket;
    onSubmit: () => void;
    isCreating: boolean;
}

const SOCKET_TYPES: SocketType[] = ['ServerSocket', 'DatagramSocket', 'Socket'];

export const SocketForm = ({
    boardName,
    socket,
    onSubmit,
    isCreating,
}: Props) => {
    const { config } = useADJState();
    const { removeSocket, addSocket } = useADJActions();
    const [formData, setFormData] = useState<Socket>(socket);
    const [originalName] = useState(socket.name);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert('Name cannot be empty');
            return;
        }

        if (!config) return;

        const boardIndex = config.boards.findIndex(
            (board) => Object.keys(board)[0] === boardName,
        );

        if (boardIndex !== -1) {
            const existingSocket = config.boards[boardIndex][
                boardName
            ].sockets?.find(
                (s: Socket) =>
                    s.name === formData.name && s.name !== originalName,
            );

            if (existingSocket) {
                alert(
                    'A socket with this name already exists. Please choose a different name.',
                );
                return;
            }
        }

        if (isCreating) {
            addSocket(boardName, formData);
        } else {
            if (originalName !== formData.name) {
                removeSocket(boardName, originalName);
                addSocket(boardName, formData);
            } else {
                removeSocket(boardName, originalName);
                addSocket(boardName, formData);
            }
        }
        onSubmit();
    };

    const updateFormField = (field: keyof Socket, value: string | number | undefined) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    return (
        <div>
            <div className="flex flex-col rounded-xl p-4">
                <h2 className="text-xl font-bold text-zinc-700 mb-4">
                    {isCreating ? 'Create Socket' : 'Edit Socket'}
                </h2>
                <form onSubmit={handleSubmit}>
                    <Input
                        object={formData}
                        field={'name'}
                        setObject={(field, value) =>
                            updateFormField(field as keyof Socket, value)
                        }
                        label="Name"
                    />

                    <div className="mt-4">
                        <label className="text-zinc-600">Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) =>
                                updateFormField(
                                    'type',
                                    e.target.value as SocketType,
                                )
                            }
                            className="focus:border-hupv-blue mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-600 focus:outline-none"
                        >
                            {SOCKET_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-4">
                        <label className="text-zinc-600">Port</label>
                        <input
                            type="number"
                            value={formData.port ?? ''}
                            onChange={(e) =>
                                updateFormField(
                                    'port',
                                    e.target.value ? parseInt(e.target.value) : undefined,
                                )
                            }
                            placeholder="e.g. 50500"
                            className="focus:border-hupv-blue mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-600 focus:outline-none"
                        />
                    </div>

                    <div className="mt-4">
                        <label className="text-zinc-600">Local Port</label>
                        <input
                            type="number"
                            value={formData.local_port ?? ''}
                            onChange={(e) =>
                                updateFormField(
                                    'local_port',
                                    e.target.value ? parseInt(e.target.value) : undefined,
                                )
                            }
                            placeholder="e.g. 50501"
                            className="focus:border-hupv-blue mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-600 focus:outline-none"
                        />
                    </div>

                    <div className="mt-4">
                        <label className="text-zinc-600">Remote IP</label>
                        <input
                            type="text"
                            value={formData.remote_ip || ''}
                            onChange={(e) =>
                                updateFormField('remote_ip', e.target.value || undefined)
                            }
                            placeholder="e.g. 192.168.1.5"
                            className="focus:border-hupv-blue mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-600 focus:outline-none"
                        />
                    </div>

                    <div className="mt-4">
                        <label className="text-zinc-600">Remote Port</label>
                        <input
                            type="number"
                            value={formData.remote_port ?? ''}
                            onChange={(e) =>
                                updateFormField(
                                    'remote_port',
                                    e.target.value ? parseInt(e.target.value) : undefined,
                                )
                            }
                            placeholder="e.g. 50500"
                            className="focus:border-hupv-blue mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-600 focus:outline-none"
                        />
                    </div>

                    <div className="flex gap-4">
                        {!isCreating && (
                            <button
                                type="button"
                                className="mt-4 w-fit cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                                onClick={() => {
                                    removeSocket(boardName, socket.name);
                                    onSubmit();
                                }}
                            >
                                <i className="fa-solid fa-trash"></i>
                            </button>
                        )}
                        <button
                            type="submit"
                            className="bg-hupv-orange/90 hover:bg-hupv-orange mt-4 w-full cursor-pointer rounded-lg px-4 py-2 text-white"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
