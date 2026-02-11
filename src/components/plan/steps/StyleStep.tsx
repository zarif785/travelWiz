import React from 'react';
import type { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import type { TripFormData, TravelType, Pace } from '@/types/trip';
import { MultiSelect } from '@/components/ui';
import { TRAVEL_TYPES, PACE_OPTIONS, INTEREST_OPTIONS } from '@/types/trip';

interface StyleStepProps {
    register: UseFormRegister<TripFormData>;
    watch: UseFormWatch<TripFormData>;
    setValue: UseFormSetValue<TripFormData>;
    errors: any;
}

export const StyleStep: React.FC<StyleStepProps> = ({
    register,
    watch,
    setValue,
    errors,
}) => {
    const travelType = watch('travelType');
    const pace = watch('pace');
    const interests = watch('interests') || [];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                    What's your travel style?
                </h2>
                <p className="text-neutral-600">
                    Help us understand your preferences
                </p>
            </div>

            <div className="space-y-6">
                {/* Travel Type */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-neutral-700">
                        Travel Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {TRAVEL_TYPES.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setValue('travelType', type.value)}
                                className={`p-4 rounded-xl text-center transition-all ${travelType === type.value
                                        ? 'bg-primary-500 text-white shadow-md'
                                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                    }`}
                            >
                                <div className="text-3xl mb-2">{type.icon}</div>
                                <div className="text-sm font-medium">{type.label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Pace */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-neutral-700">
                        Trip Pace
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {PACE_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setValue('pace', option.value)}
                                className={`p-4 rounded-xl text-left transition-all ${pace === option.value
                                        ? 'bg-primary-500 text-white shadow-md'
                                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                    }`}
                            >
                                <div className="font-semibold mb-1">{option.label}</div>
                                <div className="text-xs opacity-90">{option.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Interests */}
                <MultiSelect
                    label="Interests (select at least one)"
                    options={INTEREST_OPTIONS}
                    selected={interests}
                    onChange={(selected) => setValue('interests', selected)}
                    error={errors?.interests?.message}
                />
            </div>
        </div>
    );
};
