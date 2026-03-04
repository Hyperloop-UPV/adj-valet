export type GeneralInfo = {
    ports: Record<string, number>;
    addresses: Record<string, string>;
    units: Record<string, string>;
    message_ids: Record<string, number>;
    [key: string]: unknown;
};