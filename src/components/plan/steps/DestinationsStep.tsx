import React from 'react';
import type { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Trash2, Plus } from 'lucide-react';
import type { TripFormData } from '@/types/trip';
import { Button, Input } from '@/components/ui';

interface DestinationsStepProps {
    register: UseFormRegister<TripFormData>;
    watch: UseFormWatch<TripFormData>;
    setValue: UseFormSetValue<TripFormData>;
    errors: any;
}

export const DestinationsStep: React.FC<DestinationsStepProps> = ({
    register,
    watch,
    setValue,
    errors,
}) => {
    const destinations = watch('destinations') || [];

    const addDestination = () => {
        setValue('destinations', [...destinations, { city: '', country: '' }]);
    };

    const removeDestination = (index: number) => {
        if (destinations.length > 1) {
            setValue(
                'destinations',
                destinations.filter((_, i) => i !== index)
            );
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                    Where do you want to go?
                </h2>
                <p className="text-neutral-600">
                    Add one or more destinations for your trip
                </p>
            </div>

            <div className="space-y-4">
                {destinations.map((_, index) => (
                    <div key={index} className="flex gap-3 items-start">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Input
                                label={index === 0 ? 'City' : ''}
                                placeholder="e.g., Tokyo"
                                {...register(`destinations.${index}.city` as const)}
                                error={errors?.destinations?.[index]?.city?.message}
                            />
                            <Input
                                label={index === 0 ? 'Country' : ''}
                                placeholder="e.g., Japan"
                                {...register(`destinations.${index}.country` as const)}
                                error={errors?.destinations?.[index]?.country?.message}
                            />
                        </div>
                        {destinations.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeDestination(index)}
                                className="mt-8 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                aria-label="Remove destination"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <Button
                type="button"
                variant="secondary"
                onClick={addDestination}
                className="w-full sm:w-auto"
            >
                <Plus size={18} className="mr-2" />
                Add Another City
            </Button>

            {errors?.destinations?.message && (
                <p className="text-sm text-red-600">{errors.destinations.message}</p>
            )}
        </div>
    );
};
