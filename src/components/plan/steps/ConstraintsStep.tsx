import React from 'react';
import type { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import type { TripFormData } from '@/types/trip';
import { Input, Toggle, TagInput, Slider } from '@/components/ui';

interface ConstraintsStepProps {
    register: UseFormRegister<TripFormData>;
    watch: UseFormWatch<TripFormData>;
    setValue: UseFormSetValue<TripFormData>;
    errors: any;
}

export const ConstraintsStep: React.FC<ConstraintsStepProps> = ({
    register,
    watch,
    setValue,
    errors: _errors,
}) => {
    const withKids = watch('withKids') || false;
    const mustSee = watch('mustSee') || [];
    const avoid = watch('avoid') || [];
    const companionsCount = watch('companionsCount') || 1;
    const walkingTolerance = watch('walkingTolerance') || 5;
    const dayStartPreference = watch('dayStartPreference') || 5;
    const comfortVsBudget = watch('comfortVsBudget') || 5;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                    Any constraints or preferences?
                </h2>
                <p className="text-neutral-600">
                    Help us personalize your experience
                </p>
            </div>

            <div className="space-y-6">
                {/* Dietary & Accessibility */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Dietary Restrictions (optional)"
                        placeholder="e.g., Vegetarian, Gluten-free"
                        {...register('dietary')}
                    />
                    <Input
                        label="Accessibility Needs (optional)"
                        placeholder="e.g., Wheelchair access"
                        {...register('accessibility')}
                    />
                </div>

                {/* Traveling with Kids */}
                <Toggle
                    label="Traveling with kids?"
                    checked={withKids}
                    onChange={(checked) => setValue('withKids', checked)}
                    description="We'll suggest family-friendly activities"
                />

                {/* Must-see & Avoid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TagInput
                        label="Must-See Places"
                        tags={mustSee}
                        onChange={(tags) => setValue('mustSee', tags)}
                        placeholder="Add must-visit locations"
                    />
                    <TagInput
                        label="Places to Avoid"
                        tags={avoid}
                        onChange={(tags) => setValue('avoid', tags)}
                        placeholder="Add places to skip"
                    />
                </div>

                {/* Companions */}
                <Slider
                    label="Number of Companions"
                    value={companionsCount}
                    onChange={(value) => setValue('companionsCount', value)}
                    min={1}
                    max={10}
                    step={1}
                />

                {/* Preferences */}
                <div className="space-y-4">
                    <Slider
                        label="Walking Tolerance"
                        value={walkingTolerance}
                        onChange={(value) => setValue('walkingTolerance', value)}
                        min={0}
                        max={10}
                        leftLabel="Minimal walking"
                        rightLabel="Love to walk"
                    />

                    <Slider
                        label="Day Start Preference"
                        value={dayStartPreference}
                        onChange={(value) => setValue('dayStartPreference', value)}
                        min={0}
                        max={10}
                        leftLabel="Early Bird 🌅"
                        rightLabel="Night Owl 🌙"
                    />

                    <Slider
                        label="Comfort vs Budget"
                        value={comfortVsBudget}
                        onChange={(value) => setValue('comfortVsBudget', value)}
                        min={0}
                        max={10}
                        leftLabel="Budget-friendly"
                        rightLabel="Comfort first"
                    />
                </div>
            </div>
        </div>
    );
};
