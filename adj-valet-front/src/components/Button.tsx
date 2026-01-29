
interface Props {
    title: string | React.ReactNode;
    isSelected?: boolean;
    onClick?: () => void;
}  

export const Button = ({ title, isSelected, onClick }: Props) => (
    <div
        className={`w-full p-1 cursor-pointer rounded-lg bg-gray-200/50 hover:bg-gray-300/70 transition-colors ${isSelected ? 'bg-orange-300/60' : ''}`}
        onClick={onClick}
    >
        <div className="flex h-full items-center gap-2 px-4">
            {isSelected && (
                <i className="fa-solid fa-caret-right text-orange-600"></i>
            )}
            <div
                className={`text-lg font-semibold ${isSelected ? 'text-orange-600' : 'text-black'}`}
            >
                {title}
            </div>
        </div>
    </div>
);
