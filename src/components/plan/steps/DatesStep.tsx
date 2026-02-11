import React, { useEffect } from 'react';
import type { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import type { TripFormData } from '@/types/trip';
import { Input } from '@/components/ui';
import { calculateDuration } from '@/utils/tripProfile';

interface DatesStepProps {
    register: UseFormRegister<TripFormData>;
    watch: UseFormWatch<TripFormData>;
    setValue: UseFormSetValue<TripFormData>;
    errors: any;
}

export const DatesStep: React.FC<DatesStepProps> = ({
    register,
    watch,
    setValue,
    errors,
}) => {
    const dateMode = watch('dateMode');
    const startDate = watch('startDate');
    const endDate = watch('endDate');

    // Auto-calculate duration when dates change
    useEffect(() => {
        if (dateMode === 'range' && startDate && endDate) {
            const duration = calculateDuration(startDate, endDate);
            setValue('durationDays', duration);
        }
    }, [dateMode, startDate, endDate, setValue]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                    When are you traveling?
                </h2>
                <p className="text-neutral-600">
                    Choose specific dates or enter trip duration
                </p>
            </div>

            <div className="space-y-4">
                <div className="flex gap-4 p-4 bg-neutral-50 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setValue('dateMode', 'range')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${dateMode === 'range'
                            ? 'bg-primary-500 text-white shadow-md'
                            : 'bg-white text-neutral-700 hover:bg-neutral-100'
                            }`}
                    >
                        📅 Date Range
                    </button>
                    <button
                        type="button"
                        onClick={() => setValue('dateMode', 'duration')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${dateMode === 'duration'
                            ? 'bg-primary-500 text-white shadow-md'
                            : 'bg-white text-neutral-700 hover:bg-neutral-100'
                            }`}
                    >
                        ⏱️ Duration
                    </button>
                </div>

                {dateMode === 'range' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            type="date"
                            label="Start Date"
                            {...register('startDate')}
                            error={errors?.startDate?.message}
                        />
                        <Input
                            type="date"
                            label="End Date"
                            {...register('endDate')}
                            error={errors?.endDate?.message}
                        />
                    </div>
                ) : (
                    <Input
                        type="number"
                        label="Duration (days)"
                        placeholder="e.g., 7"
                        min={1}
                        {...register('durationDays', { valueAsNumber: true })}
                        error={errors?.durationDays?.message}
                    />
                )}

                {dateMode === 'range' && startDate && endDate && (
                    <div className="p-4 bg-primary-50 rounded-xl">
                        <p className="text-sm text-primary-900">
                            <strong>Trip Duration:</strong> {calculateDuration(startDate, endDate)} days
                        </p>
                    </div>
                )}
            </div>

            {errors?.dateMode?.message && (
                <p className="text-sm text-red-600">{errors.dateMode.message}</p>
            )}
        </div>
    );
};
