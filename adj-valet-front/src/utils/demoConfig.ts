import { ADJ } from '../types/ADJ';

export const demoConfig: ADJ = {
    general_info: {
        ports: {
            telemetry: 5001,
            commands: 5002,
            diagnostics: 5003,
        },
        addresses: {
            telemetry: '239.0.0.10',
            commands: '239.0.0.11',
            diagnostics: '239.0.0.12',
        },
        units: {
            voltage: 'V',
            current: 'A',
            temperature: 'C',
            pressure: 'kPa',
        },
        message_ids: {
            telemetry: 4913,
            commands: 900,
            diagnostics: 940,
        },
    },
    board_list: {
        HVSCU: 'boards/HVSCU/HVSCU.json',
        BMSL: 'boards/BMSL/BMSL.json',
        VCU: 'boards/VCU/VCU.json',
    },
    boards: [
        {
            HVSCU: {
                board_id: 15,
                board_ip: '192.168.1.150',
                measurements: [
                    {
                        id: 'battery_voltage',
                        name: 'Batteries Voltage',
                        type: 'float32',
                        podUnits: 'V',
                        displayUnits: 'V',
                        safeRange: [320, 420],
                        warningRange: [300, 440],
                    },
                    {
                        id: 'battery_current',
                        name: 'Battery Current',
                        type: 'float32',
                        podUnits: 'A',
                        displayUnits: 'A',
                        safeRange: [-120, 120],
                        warningRange: [-160, 160],
                    },
                    {
                        id: 'battery_temp',
                        name: 'Battery Temp',
                        type: 'float32',
                        podUnits: 'C',
                        displayUnits: 'C',
                        safeRange: [10, 55],
                        warningRange: [0, 65],
                    },
                ],
                packets: [
                    {
                        id: 900,
                        type: 'order',
                        name: 'Close Contactors',
                        variables: [],
                        socket: 'hvscu_cmd',
                    },
                    {
                        id: 901,
                        type: 'order',
                        name: 'Open Contactors',
                        variables: [],
                        socket: 'hvscu_cmd',
                    },
                    {
                        id: 902,
                        type: 'data',
                        name: 'HVSCU Telemetry',
                        variables: ['battery_voltage', 'battery_current', 'battery_temp'],
                        period_ms: 50,
                        socket: 'hvscu_telemetry',
                    },
                ],
                sockets: [
                    {
                        type: 'ServerSocket',
                        name: 'hvscu_cmd',
                        port: 50500,
                    },
                    {
                        type: 'DatagramSocket',
                        name: 'hvscu_telemetry',
                        port: 50501,
                        remote_ip: '239.0.0.10',
                    },
                ],
            },
        },
        {
            BMSL: {
                board_id: 18,
                board_ip: '192.168.1.120',
                measurements: [
                    {
                        id: 'cell_1',
                        name: 'Battery 1',
                        type: 'float32',
                        podUnits: 'V',
                        displayUnits: 'V',
                        safeRange: [3.1, 4.2],
                        warningRange: [2.9, 4.3],
                    },
                    {
                        id: 'cell_2',
                        name: 'Battery 2',
                        type: 'float32',
                        podUnits: 'V',
                        displayUnits: 'V',
                        safeRange: [3.1, 4.2],
                        warningRange: [2.9, 4.3],
                    },
                ],
                packets: [
                    {
                        id: 930,
                        type: 'data',
                        name: 'Cell Readings',
                        variables: ['cell_1', 'cell_2'],
                        period_ms: 100,
                    },
                ],
                sockets: [],
            },
        },
        {
            VCU: {
                board_id: 21,
                board_ip: '192.168.1.200',
                measurements: [
                    {
                        id: 'pressure',
                        name: 'Brake Pressure',
                        type: 'float32',
                        podUnits: 'kPa',
                        displayUnits: 'kPa',
                        safeRange: [80, 110],
                        warningRange: [60, 120],
                    },
                ],
                packets: [
                    {
                        id: 940,
                        type: 'data',
                        name: 'VCU Status',
                        variables: ['pressure'],
                        period_ms: 30,
                    },
                ],
                sockets: [],
            },
        },
    ],
};
