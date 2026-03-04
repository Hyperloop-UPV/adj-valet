import { useADJState } from '../store/ADJStore';
import { ArrayObjForm } from './ArrayObjForm';
import { Badge } from './ui/badge';

export const GeneralInfoForm = () => {
    const { config } = useADJState();

    if (!config?.general_info) {
        return (
            <div className="flex w-full items-center justify-center p-8">
                <p className="text-gray-500">
                    No general information available
                </p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-auto p-8">
            <div className="mb-6 flex flex-wrap items-center gap-3">
                <div>
                    <h1 className="text-3xl font-semibold">
                        General Information
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Configure global settings for the ADJ system.
                    </p>
                </div>
                <Badge variant="secondary">Global</Badge>
            </div>

            <div className="flex h-auto w-full flex-row flex-wrap gap-3">
                {Object.keys(config.general_info).map((section) => (
                    <ArrayObjForm key={section} sectionName={section} />
                ))}
            </div>
        </div>
    );
};
