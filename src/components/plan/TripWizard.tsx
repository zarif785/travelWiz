import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { TripFormData, TripProfile } from '@/types/trip';
import {
    destinationsStepSchema,
    datesStepSchema,
    budgetStepSchema,
    styleStepSchema,
    constraintsStepSchema,
} from '@/types/trip';
import { useItinerary, useTripProfile } from '@/context';
import { buildTripProfile } from '@/utils/tripProfile';
import { generateItineraryRequest } from '@/services/itineraryApi';
import { WizardLayout } from './WizardLayout';
import { DestinationsStep } from './steps/DestinationsStep';
import { DatesStep } from './steps/DatesStep';
import { BudgetStep } from './steps/BudgetStep';
import { StyleStep } from './steps/StyleStep';
import { ConstraintsStep } from './steps/ConstraintsStep';
import { ReviewStep } from './steps/ReviewStep';

const STEP_TITLES = ['Destinations', 'Dates', 'Budget', 'Style', 'Preferences', 'Review'];

const STEP_SCHEMAS = [
    destinationsStepSchema,
    datesStepSchema,
    budgetStepSchema,
    styleStepSchema,
    constraintsStepSchema,
    null, // Review step has no validation
];

const DEFAULT_VALUES: Partial<TripFormData> = {
    destinations: [{ city: '', country: '' }],
    dateMode: 'range',
    currency: 'AUD',
    enablePerDayBudget: false,
    travelType: 'sightseeing',
    pace: 'balanced',
    interests: [],
    withKids: false,
    mustSee: [],
    avoid: [],
    companionsCount: 1,
    walkingTolerance: 5,
    dayStartPreference: 5,
    comfortVsBudget: 5,
};

export const TripWizard: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaved, setIsSaved] = useState(false);
    const [generatedProfile, setGeneratedProfile] = useState<TripProfile | null>(null);
    const [generateError, setGenerateError] = useState<string | undefined>();
    const draftSaveTimerRef = useRef<number | null>(null);

    const { draftFormData, saveDraft, saveFinalTripProfile, clearDraft } = useTripProfile();
    const { getItineraryByTripId, saveItinerary } = useItinerary();

    const {
        register,
        watch,
        setValue,
        setError,
        clearErrors,
        getValues,
        formState: { errors },
        reset,
    } = useForm<TripFormData>({
        defaultValues: DEFAULT_VALUES,
        mode: 'onChange',
    });

    // Load draft on mount
    useEffect(() => {
        if (draftFormData) {
            reset({ ...DEFAULT_VALUES, ...draftFormData });
        }
    }, [draftFormData, reset]);

    // Auto-save draft (debounced)
    useEffect(() => {
        const subscription = watch((value) => {
            if (draftSaveTimerRef.current !== null) {
                window.clearTimeout(draftSaveTimerRef.current);
            }

            draftSaveTimerRef.current = window.setTimeout(() => {
                saveDraft(value as Partial<TripFormData>);
            }, 700);
        });

        return () => {
            if (draftSaveTimerRef.current !== null) {
                window.clearTimeout(draftSaveTimerRef.current);
                draftSaveTimerRef.current = null;
            }
            subscription.unsubscribe();
        };
    }, [watch, saveDraft]);

    const handleNext = async () => {
        const schema = STEP_SCHEMAS[currentStep];
        if (schema) {
            clearErrors();
            const result = schema.safeParse(getValues());
            if (!result.success) {
                result.error.issues.forEach((issue) => {
                    if (issue.path.length > 0) {
                        setError(issue.path.join('.') as any, {
                            type: 'manual',
                            message: issue.message,
                        });
                    }
                });
                return;
            }
        }

        if (currentStep === STEP_TITLES.length - 2) {
            // Before review step, generate the profile
            const formData = getValues();
            const profile = buildTripProfile(formData as TripFormData);
            setGeneratedProfile(profile);
        }

        setCurrentStep((prev) => Math.min(prev + 1, STEP_TITLES.length - 1));
    };

    const handleBack = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };

    const handleSave = () => {
        if (generatedProfile) {
            saveFinalTripProfile(generatedProfile);
            setIsSaved(true);
        }
    };

    const generateMutation = useMutation({
        mutationFn: async (tripProfile: TripProfile) => generateItineraryRequest({ tripProfile }),
        onSuccess: (response) => {
            setGenerateError(undefined);
            saveItinerary(response.itinerary);
            navigate(`/itinerary/${response.itinerary.id}`);
        },
        onError: (error) => {
            setGenerateError(
                error instanceof Error
                    ? error.message
                    : 'Could not generate itinerary right now. Please try again.'
            );
        },
    });

    const handleGenerateItinerary = () => {
        if (!generatedProfile) return;
        setGenerateError(undefined);
        if (!isSaved) {
            saveFinalTripProfile(generatedProfile);
            setIsSaved(true);
        }
        const existingItinerary = getItineraryByTripId(generatedProfile.id);
        if (existingItinerary) {
            navigate(`/itinerary/${existingItinerary.id}`);
            return;
        }
        generateMutation.mutate(generatedProfile);
    };

    const handleViewItinerary = () => {
        if (!generatedProfile) return;
        const existingItinerary = getItineraryByTripId(generatedProfile.id);
        if (!existingItinerary) return;
        navigate(`/itinerary/${existingItinerary.id}`);
    };

    const handleReset = () => {
        if (confirm('Are you sure you want to reset the wizard? All progress will be lost.')) {
            clearDraft();
            reset(DEFAULT_VALUES);
            setCurrentStep(0);
            setIsSaved(false);
            setGeneratedProfile(null);
        }
    };

    const renderStep = () => {
        const commonProps = {
            register,
            watch,
            setValue,
            errors,
        };

        const savedItineraryForTrip = generatedProfile
            ? getItineraryByTripId(generatedProfile.id)
            : null;

        switch (currentStep) {
            case 0:
                return <DestinationsStep {...commonProps} />;
            case 1:
                return <DatesStep {...commonProps} />;
            case 2:
                return <BudgetStep {...commonProps} />;
            case 3:
                return <StyleStep {...commonProps} />;
            case 4:
                return <ConstraintsStep {...commonProps} />;
            case 5:
                return (
                    <ReviewStep
                        formData={getValues() as TripFormData}
                        tripProfile={generatedProfile}
                        onSave={handleSave}
                        onGenerateItinerary={handleGenerateItinerary}
                        onViewItinerary={handleViewItinerary}
                        hasSavedItinerary={!!savedItineraryForTrip}
                        isSaved={isSaved}
                        isGeneratingItinerary={generateMutation.isPending}
                        generateError={generateError}
                    />
                );
            default:
                return null;
        }
    };

    const canGoNext = () => {
        // For review step, we don't need validation
        if (currentStep === STEP_TITLES.length - 1) return false;
        return true;
    };

    return (
        <div className="py-8">
            <div className="mb-6 flex justify-between items-center max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-neutral-900">Plan Your Trip</h1>
                <button
                    type="button"
                    onClick={handleReset}
                    className="text-sm text-neutral-600 hover:text-neutral-900 underline"
                >
                    Reset
                </button>
            </div>

            <WizardLayout
                currentStep={currentStep}
                totalSteps={STEP_TITLES.length}
                stepTitles={STEP_TITLES}
                onNext={handleNext}
                onBack={handleBack}
                canGoNext={canGoNext()}
                isLastStep={currentStep === STEP_TITLES.length - 1}
            >
                {renderStep()}
            </WizardLayout>
        </div>
    );
};
