interface Props {
    socketName: string;
    socketType: string;
    onSelect: () => void;
}

export const SocketCard = ({ socketName, socketType, onSelect }: Props) => {
    return (
        <div
            onClick={onSelect}
            className="mb-4 cursor-pointer rounded-lg bg-emerald-500/40 p-4 shadow-md transition-colors hover:bg-emerald-600/90"
        >
            <div className="flex items-center justify-between gap-8">
                <div className="text-lg font-medium text-gray-900">
                    {socketName}
                </div>
                <div className="text-sm text-gray-500">{socketType}</div>
            </div>
        </div>
    );
};
