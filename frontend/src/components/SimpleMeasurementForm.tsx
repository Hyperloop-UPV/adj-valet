import { useState } from 'react';
import { useADJActions } from '../store/ADJStore';
import { Measurement } from '../types/Measurement';
import { BoardName } from '../types/Board';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface Props {
    boardName: BoardName;
    measurement: Measurement;
    isCreating: boolean;
    onSubmit: () => void;
}

export const SimpleMeasurementForm = ({ boardName, measurement, isCreating, onSubmit }: Props) => {
    const { addMeasurement, updateMeasurement, removeMeasurement } = useADJActions();
    const [formData, setFormData] = useState<Measurement>(measurement);
    const [enumInputValue, setEnumInputValue] = useState(measurement.enumValues?.join(', ') || '');
    const [hasSafeRange, setHasSafeRange] = useState(isCreating ? false : !!measurement.safeRange);
    const [hasWarningRange, setHasWarningRange] = useState(isCreating ? false : !!measurement.warningRange);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Process enum values before submitting
        processEnumValues(enumInputValue);

        if (!formData.id.trim()) {
            alert('ID cannot be empty');
            return;
        }

        if (!formData.name.trim()) {
            alert('Name cannot be empty');
            return;
        }

        // Create the final form data with processed enum values and conditional ranges
        const processedEnumValues = enumInputValue.split(',').map(v => v.trim()).filter(v => v.length > 0);
        const finalFormData: Measurement = {
            ...formData,
            enumValues: formData.type === 'enum' && processedEnumValues.length > 0 ? processedEnumValues : undefined,
            safeRange: hasSafeRange ? formData.safeRange : undefined,
            warningRange: hasWarningRange ? formData.warningRange : undefined,
        };

        if (isCreating) {
            addMeasurement(boardName, finalFormData);
        } else {
            // Update each field
            Object.keys(finalFormData).forEach(key => {
                updateMeasurement(boardName, measurement.id, key as keyof Measurement, finalFormData[key as keyof Measurement]);
            });
        }

        onSubmit();
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete measurement "${measurement.name}"?`)) {
            removeMeasurement(boardName, measurement.id);
            onSubmit();
        }
    };

    const handleFieldChange = (field: keyof Measurement, value: unknown) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleRangeChange = (rangeType: 'safeRange' | 'warningRange', index: 0 | 1, value: string) => {
        const numValue = parseFloat(value) || 0;
        setFormData(prev => {
            const currentRange = prev[rangeType] || [0, 0];
            return {
                ...prev,
                [rangeType]: index === 0 
                    ? [numValue, currentRange[1]] 
                    : [currentRange[0], numValue]
            };
        });
    };

    const handleSafeRangeToggle = (enabled: boolean) => {
        setHasSafeRange(enabled);
        if (enabled && !formData.safeRange) {
            setFormData(prev => ({ ...prev, safeRange: [0, 0] }));
        }
    };

    const handleWarningRangeToggle = (enabled: boolean) => {
        setHasWarningRange(enabled);
        if (enabled && !formData.warningRange) {
            setFormData(prev => ({ ...prev, warningRange: [0, 0] }));
        }
    };

    const handleEnumValuesChange = (value: string) => {
        setEnumInputValue(value);
    };

    const processEnumValues = (value: string) => {
        const values = value.split(',').map(v => v.trim()).filter(v => v.length > 0);
        setFormData(prev => ({ ...prev, enumValues: values }));
    };

    return (
        <div className="p-4 pt-0 max-h-[80vh] flex flex-col">
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>ID</Label>
                        <Input
                            type="text"
                            value={formData.id}
                            onChange={(e) => handleFieldChange('id', e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <Label>Name</Label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <Label>Type</Label>
                        <select
                            value={formData.type}
                            onChange={(e) => handleFieldChange('type', e.target.value)}
                            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <option value="float32">float32</option>
                            <option value="float64">float64</option>
                            <option value="uint8">uint8</option>
                            <option value="uint16">uint16</option>
                            <option value="uint32">uint32</option>
                            <option value="uint64">uint64</option>
                            <option value="int8">int8</option>
                            <option value="int16">int16</option>
                            <option value="int32">int32</option>
                            <option value="int64">int64</option>
                            <option value="bool">bool</option>
                            <option value="enum">enum</option>
                        </select>
                    </div>

                    {formData.type !== 'enum' && (
                        <>
                            <div>
                                <Label>Pod Units</Label>
                                <Input
                                    type="text"
                                    value={formData.podUnits}
                                    onChange={(e) => handleFieldChange('podUnits', e.target.value)}
                                />
                            </div>

                            <div>
                                <Label>Display Units</Label>
                                <Input
                                    type="text"
                                    value={formData.displayUnits}
                                    onChange={(e) => handleFieldChange('displayUnits', e.target.value)}
                                />
                            </div>
                        </>
                    )}
                </div>

                {formData.type === 'enum' && (
                    <div>
                        <Label>Enum Values (comma-separated)</Label>
                        <Input
                            type="text"
                            value={enumInputValue}
                            onChange={(e) => handleEnumValuesChange(e.target.value)}
                            onBlur={(e) => processEnumValues(e.target.value)}
                            placeholder="Value1, Value2, Value3"
                        />
                    </div>
                )}

                {formData.type !== 'enum' && (
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <input
                                    type="checkbox"
                                    id="hasSafeRange"
                                    checked={hasSafeRange}
                                    onChange={(e) => handleSafeRangeToggle(e.target.checked)}
                                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                />
                                <Label htmlFor="hasSafeRange">Safe Range</Label>
                            </div>
                            {hasSafeRange && (
                                <div className="grid grid-cols-2 gap-2 ml-6">
                                    <div>
                                        <Input
                                            type="number"
                                            step="any"
                                            value={formData.safeRange?.[0] ?? ''}
                                            onChange={(e) => handleRangeChange('safeRange', 0, e.target.value)}
                                            placeholder="Min"
                                        />
                                        <span className="text-xs text-gray-500 mt-1 block">Minimum</span>
                                    </div>
                                    <div>
                                        <Input
                                            type="number"
                                            step="any"
                                            value={formData.safeRange?.[1] ?? ''}
                                            onChange={(e) => handleRangeChange('safeRange', 1, e.target.value)}
                                            placeholder="Max"
                                        />
                                        <span className="text-xs text-gray-500 mt-1 block">Maximum</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <input
                                    type="checkbox"
                                    id="hasWarningRange"
                                    checked={hasWarningRange}
                                    onChange={(e) => handleWarningRangeToggle(e.target.checked)}
                                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                />
                                <Label htmlFor="hasWarningRange">Warning Range</Label>
                            </div>
                            {hasWarningRange && (
                                <div className="grid grid-cols-2 gap-2 ml-6">
                                    <div>
                                        <Input
                                            type="number"
                                            step="any"
                                            value={formData.warningRange?.[0] ?? ''}
                                            onChange={(e) => handleRangeChange('warningRange', 0, e.target.value)}
                                            placeholder="Min"
                                        />
                                        <span className="text-xs text-gray-500 mt-1 block">Minimum</span>
                                    </div>
                                    <div>
                                        <Input
                                            type="number"
                                            step="any"
                                            value={formData.warningRange?.[1] ?? ''}
                                            onChange={(e) => handleRangeChange('warningRange', 1, e.target.value)}
                                            placeholder="Max"
                                        />
                                        <span className="text-xs text-gray-500 mt-1 block">Maximum</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </form>

            <div className="flex justify-end gap-3 pt-4 flex-shrink-0">
                {!isCreating && (
                    <Button
                        type="button"
                        onClick={handleDelete}
                        variant="destructive"
                    >
                        Delete
                    </Button>
                )}

                <Button
                    type="button"
                    onClick={onSubmit}
                    variant="outline"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    onClick={handleSubmit}
                >
                    {isCreating ? 'Add Measurement' : 'Update Measurement'}
                </Button>
            </div>
        </div>
    );
};
