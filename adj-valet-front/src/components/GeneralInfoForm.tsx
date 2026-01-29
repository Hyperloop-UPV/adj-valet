import { useADJState } from '../store/ADJStore';
import { ArrayObjForm } from './ArrayObjForm';

export const GeneralInfoForm = () => {
    const { config } = useADJState();

    if (!config?.general_info) {
        return (
            <div className="flex w-full items-center justify-center p-8">
                <p className="text-gray-500">No general information available</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-auto p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">General Information</h1>
                <p className="text-gray-600 mt-2">Configure global settings for the ADJ system</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {Object.keys(config.general_info).map((section) => (
                    <ArrayObjForm key={section} sectionName={section} />
                ))}
            </div>
        </div>
    );
};
