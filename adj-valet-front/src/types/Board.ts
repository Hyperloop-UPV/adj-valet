import { Measurement } from './Measurement';
import { Packet } from './Packet';
import { Socket } from './Socket';

export type BoardName = string;

export type BoardInfo = {
    board_id: number;
    board_ip: string;
    measurements: Measurement[];
    packets: Packet[];
    sockets: Socket[];
};

export type Board = Record<BoardName, BoardInfo>;
