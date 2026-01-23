export type Packet = {
    id?: number;
    type: string;
    name: string;
    variables: string[];
    period_ms?: number;
    socket?: string;
};
