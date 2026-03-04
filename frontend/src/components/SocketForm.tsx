import { useState, useEffect } from 'react';
import { useADJActions, useADJState } from '../store/ADJStore';
import { Socket, SocketType } from '../types/Socket';
import { Input as FieldInput } from './Input';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

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

    useEffect(() => {
        if (formData.type === 'ServerSocket') {
            setFormData((prev) => ({
                ...prev,
                local_port: undefined,
                remote_ip: undefined,
                remote_port: undefined,
            }));
        } else if (formData.type === 'DatagramSocket') {
            setFormData((prev) => ({
                ...prev,
                local_port: undefined,
                remote_port: undefined,
            }));
        } else if (formData.type === 'Socket') {
            setFormData((prev) => ({
                ...prev,
                port: undefined,
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.type]);

    const validateByType = (): boolean => {
        if (!formData.name.trim()) {
            alert('Name cannot be empty');
            return false;
        }

        if (formData.type === 'ServerSocket') {
            if (!formData.port) {
                alert('Port is required for ServerSocket');
                return false;
            }
        }

        if (formData.type === 'DatagramSocket') {
            if (!formData.port) {
                alert('Port is required for DatagramSocket');
                return false;
            }
            if (!formData.remote_ip || !formData.remote_ip.trim()) {
                alert('Remote IP is required for DatagramSocket');
                return false;
            }
        }

        if (formData.type === 'Socket') {
            if (!formData.local_port) {
                alert('Local port is required for Socket');
                return false;
            }
            if (!formData.remote_ip || !formData.remote_ip.trim()) {
                alert('Remote IP is required for Socket');
                return false;
            }
            if (!formData.remote_port) {
                alert('Remote port is required for Socket');
                return false;
            }
        }

        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateByType()) return;

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

    const updateFormField = (
        field: keyof Socket,
        value: string | number | undefined,
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    return (
        <div>
            <div className="flex flex-col rounded-xl p-4">
                <form onSubmit={handleSubmit}>
                    <FieldInput
                        object={formData}
                        field={'name'}
                        setObject={(field, value) =>
                            updateFormField(field as keyof Socket, value)
                        }
                        label="Name"
                    />

                    <div className="mt-4">
                        <Label>Type</Label>
                        <select
                            value={formData.type}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    type: e.target.value as SocketType,
                                }))
                            }
                            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {SOCKET_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    {(formData.type === 'ServerSocket' ||
                        formData.type === 'DatagramSocket') && (
                        <div className="mt-4">
                            <Label>Port</Label>
                            <Input
                                type="number"
                                value={formData.port ?? ''}
                                onChange={(e) =>
                                    updateFormField(
                                        'port',
                                        e.target.value
                                            ? parseInt(e.target.value)
                                            : undefined,
                                    )
                                }
                                placeholder="e.g. 50500"
                            />
                        </div>
                    )}

                    {formData.type === 'Socket' && (
                        <div className="mt-4">
                            <Label>Local Port</Label>
                            <Input
                                type="number"
                                value={formData.local_port ?? ''}
                                onChange={(e) =>
                                    updateFormField(
                                        'local_port',
                                        e.target.value
                                            ? parseInt(e.target.value)
                                            : undefined,
                                    )
                                }
                                placeholder="e.g. 50501"
                            />
                        </div>
                    )}

                    {(formData.type === 'DatagramSocket' ||
                        formData.type === 'Socket') && (
                        <div className="mt-4">
                            <Label>Remote IP</Label>
                            <Input
                                type="text"
                                value={formData.remote_ip || ''}
                                onChange={(e) =>
                                    updateFormField(
                                        'remote_ip',
                                        e.target.value || undefined,
                                    )
                                }
                                placeholder="e.g. 192.168.1.5"
                            />
                        </div>
                    )}

                    {formData.type === 'Socket' && (
                        <div className="mt-4">
                            <Label>Remote Port</Label>
                            <Input
                                type="number"
                                value={formData.remote_port ?? ''}
                                onChange={(e) =>
                                    updateFormField(
                                        'remote_port',
                                        e.target.value
                                            ? parseInt(e.target.value)
                                            : undefined,
                                    )
                                }
                                placeholder="e.g. 50500"
                            />
                        </div>
                    )}

                    <div className="flex gap-3">
                        {!isCreating && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => {
                                    removeSocket(boardName, socket.name);
                                    onSubmit();
                                }}
                            >
                                Delete
                            </Button>
                        )}
                        <Button
                            type="submit"
                        >
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
