import { useADJState } from '../store/ADJStore';
import { ArrayObjForm } from './ArrayObjForm';
import { Badge } from './ui/badge';

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
            <div className="mb-6 flex flex-wrap items-center gap-3">
                <div>
                    <h1 className="text-3xl font-semibold">General Information</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Configure global settings for the ADJ system.
                    </p>
                </div>
                <Badge variant="secondary">Global</Badge>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
                {Object.keys(config.general_info).map((section) => (
                    <ArrayObjForm key={section} sectionName={section} />
                ))}
            </div>
        </div>
    );
};
