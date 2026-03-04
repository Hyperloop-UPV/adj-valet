export type SocketType = 'ServerSocket' | 'DatagramSocket' | 'Socket';

export type Socket = {
    type: SocketType;
    name: string;
    port?: number;
    local_port?: number;
    remote_ip?: string;
    remote_port?: number;
};
