import { ADJ } from "../types/ADJ";

export const ADJ_INFO_MOCK: ADJ = {
    general_info: {
        ports: { "HTTP": 80, "HTTPS": 443 },
        addresses: { "server": "192.168.1.1", "backup": "192.168.1.2" },
        units: { "temperature": "Celsius", "pressure": "Pascal" },
        message_ids: { "start": 1, "stop": 2 }
    },
    board_list: {
        OBCCU: "boards/OBCCU/OBCCU.json",
        VCU: "boards/VCU/VCU.json",
        LCU: "boards/LCU/LCU.json"
    },
    boards: [
        {
            "OBCCU": {
                board_id: 101,
                board_ip: "192.168.1.1",
                measurements: [
                    {
                        id: "25",
                        name: "Engine Temperature",
                        type: "float32",
                        podUnits: "C",
                        displayUnits: "Celsius",
                        enumValues: ["Low", "Medium", "High"],
                        safeRange: [20, 80],
                        warningRange: [10, 90]
                    },
                    {
                        id: "26",
                        name: "Oil Pressure",
                        type: "uint16",
                        podUnits: "Bar",
                        displayUnits: "Bar",
                        enumValues: ["Critical", "Normal", "High"],
                        safeRange: [2, 5],
                        warningRange: [1, 6]
                    }
                ],
                packets: [
                    {
                        id: 1,
                        type: "DATA",
                        name: "Sensor Data",
                        variables: ["temperature", "pressure", "speed"]
                    },
                    {
                        id: 2,
                        type: "order",
                        name: "Control Commands",
                        variables: ["start", "stop", "reset"]
                    }
                ],
                sockets: []
            }
        },
        {
            "VCU": {
                board_id: 102,
                board_ip: "192.168.1.2",
                measurements: [
                    {
                        id: "50",
                        name: "Battery Voltage",
                        type: "float32",
                        podUnits: "V",
                        displayUnits: "Volts",
                        enumValues: [],
                        safeRange: [48, 54],
                        warningRange: [45, 57]
                    }
                ],
                packets: [
                    {
                        id: 10,
                        type: "DATA",
                        name: "Battery Status",
                        variables: ["voltage", "current", "temperature"]
                    }
                ],
                sockets: []
            }
        },
        {
            "LCU": {
                board_id: 103,
                board_ip: "192.168.1.3",
                measurements: [
                    {
                        id: "75",
                        name: "Track Position",
                        type: "uint16",
                        podUnits: "mm",
                        displayUnits: "Millimeters",
                        enumValues: ["Start", "Middle", "End"],
                        safeRange: [0, 1000],
                        warningRange: [-50, 1050]
                    }
                ],
                packets: [
                    {
                        id: 20,
                        type: "DATA",
                        name: "Position Data",
                        variables: ["x", "y", "z"]
                    }
                ],
                sockets: []
            }
        }
    ]
};
