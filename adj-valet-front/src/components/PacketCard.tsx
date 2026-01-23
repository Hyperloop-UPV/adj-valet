interface Props {
    packetId?: number;
    packetName: string;
    onSelect: () => void;
}

export const PacketCard = ({ packetId, packetName, onSelect }: Props) => {
    return (
        <div
            onClick={onSelect}
            className="bg-hupv-blue/40 hover:bg-hupv-orange/90 mb-4 cursor-pointer rounded-lg p-4 shadow-md transition-colors"
        >
            <div className="flex items-center justify-between gap-8">
                <div className="text-lg font-medium text-gray-900">
                    {packetName}
                </div>
                <div className="text-sm text-gray-500">
                    ID: {packetId ?? '-'}
                </div>
            </div>
        </div>
    );
};
