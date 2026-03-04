import { useADJState, useADJActions } from '../store/ADJStore';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface Props {
    sectionName: string;
}

export const ArrayObjForm = ({ sectionName }: Props) => {
    const { config } = useADJState();
    const {
        updateGeneralInfo,
        addGeneralInfoField,
        removeGeneralInfoField,
    } = useADJActions();

    const [editingKeys, setEditingKeys] = useState<Record<string, string>>({});

    if (!config?.general_info) {
        return <div>No configuration available</div>;
    }

    const handleKeyChange = (oldKey: string, newKey: string) => {
        setEditingKeys({
            ...editingKeys,
            [oldKey]: newKey
        });
    };

    const handleKeyBlur = (oldKey: string) => {
        const newKey = editingKeys[oldKey];
        if (newKey && newKey !== oldKey && config?.general_info) {
            const currentValue = (config.general_info[sectionName] as Record<string, unknown>)[oldKey];
            // First remove the old key
            removeGeneralInfoField(sectionName, oldKey);
            // Then add the new key with the old value
            updateGeneralInfo(sectionName, newKey, currentValue);
            
            setEditingKeys(prev => {
                const updated = {...prev};
                delete updated[oldKey];
                return updated;
            });
        }
    };

    const handleValueChange = (key: string, value: string) => {
        updateGeneralInfo(sectionName, key, value);
    };

    return (
        <Card className="min-w-80 max-h-[calc(100vh-12rem)] overflow-hidden">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="capitalize">
                    {sectionName.replace(/_/g, ' ')}
                </CardTitle>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => addGeneralInfoField(sectionName)}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-3 overflow-y-auto pb-4">
                {Object.entries(
                    config.general_info[sectionName] as Record<string, unknown>,
                ).map(([key, value]) => (
                    <div key={key} className="grid min-w-0 grid-cols-[1fr_1fr_56px] gap-3 items-center">
                        <Input
                            value={editingKeys[key] ?? key}
                            onChange={(e) => handleKeyChange(key, e.target.value)}
                            onBlur={() => handleKeyBlur(key)}
                            placeholder="Field name"
                        />
                        <Input
                            value={String(value)}
                            onChange={(e) => handleValueChange(key, e.target.value)}
                            placeholder="Value"
                        />
                        <button
                            type="button"
                            onClick={() => removeGeneralInfoField(sectionName, key)}
                            title="Remove field"
                            className="inline-flex h-11 w-14 items-center justify-center rounded-xl bg-destructive text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};
