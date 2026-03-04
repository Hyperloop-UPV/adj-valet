export type Measurement = {
    id: string;
    name: string;
    type: string;
    displayUnits?: string;
    podUnits?: string;
    enumValues?: string[];
    safeRange?: [number, number];
    warningRange?: [number, number];
}; 