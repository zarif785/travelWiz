import React, { useEffect } from 'react';
import type { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import type { TripFormData, Currency } from '@/types/trip';
import { Input, Toggle } from '@/components/ui';
import { CURRENCY_OPTIONS } from '@/types/trip';
import { calculatePerDayBudget } from '@/utils/tripProfile';

interface BudgetStepProps {
    register: UseFormRegister<TripFormData>;
    watch: UseFormWatch<TripFormData>;
    setValue: UseFormSetValue<TripFormData>;
    errors: any;
}

export const BudgetStep: React.FC<BudgetStepProps> = ({
    register,
    watch,
    setValue,
    errors,
}) => {
    const currency = watch('currency');
    const budgetTotal = watch('budgetTotal');
    const enablePerDayBudget = watch('enablePerDayBudget');
    const durationDays = watch('durationDays') || 1;

    // Auto-calculate per-day budget when enabled
    useEffect(() => {
        if (enablePerDayBudget && budgetTotal && durationDays) {
            const perDay = calculatePerDayBudget(budgetTotal, durationDays);
            setValue('budgetPerDay', perDay);
        }
    }, [enablePerDayBudget, budgetTotal, durationDays, setValue]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                    What's your budget?
                </h2>
                <p className="text-neutral-600">
                    Set your total budget and preferred currency
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-neutral-700 mb-2 block">
                        Currency
                    </label>
                    <select
                        {...register('currency')}
                        className="w-full px-4 py-2 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
                    >
                        {CURRENCY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.symbol} - {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <Input
                    type="number"
                    label="Total Budget"
                    placeholder="e.g., 5000"
                    min={1}
                    {...register('budgetTotal', { valueAsNumber: true })}
                    error={errors?.budgetTotal?.message}
                />

                <Toggle
                    label="Show per-day budget"
                    checked={enablePerDayBudget || false}
                    onChange={(checked) => setValue('enablePerDayBudget', checked)}
                    description="Calculate or enter your daily spending limit"
                />

                {enablePerDayBudget && (
                    <Input
                        type="number"
                        label="Per-Day Budget"
                        placeholder="Auto-calculated"
                        min={1}
                        {...register('budgetPerDay', { valueAsNumber: true })}
                        error={errors?.budgetPerDay?.message}
                    />
                )}

                {enablePerDayBudget && budgetTotal && durationDays && (
                    <div className="p-4 bg-primary-50 rounded-xl">
                        <p className="text-sm text-primary-900">
                            <strong>Suggested per-day:</strong>{' '}
                            {CURRENCY_OPTIONS.find((c) => c.value === currency)?.symbol}
                            {calculatePerDayBudget(budgetTotal, durationDays)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
