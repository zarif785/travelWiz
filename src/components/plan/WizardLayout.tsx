import React from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WizardLayoutProps {
    currentStep: number;
    totalSteps: number;
    stepTitles: string[];
    children: ReactNode;
    onNext: () => void;
    onBack: () => void;
    canGoNext: boolean;
    isLastStep: boolean;
}

export const WizardLayout: React.FC<WizardLayoutProps> = ({
    currentStep,
    totalSteps,
    stepTitles,
    children,
    onNext,
    onBack,
    canGoNext,
    isLastStep,
}) => {
    const progress = ((currentStep + 1) / totalSteps) * 100;

    return (
        <div className="max-w-3xl mx-auto">
            {/* Stepper Header */}
            <div className="mb-8">
                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Step Indicators */}
                <div className="flex justify-between items-center">
                    {stepTitles.map((title, index) => (
                        <div
                            key={index}
                            className="flex flex-col items-center flex-1"
                        >
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-2 transition-all ${index <= currentStep
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-neutral-200 text-neutral-500'
                                    }`}
                            >
                                {index + 1}
                            </div>
                            <span
                                className={`text-xs text-center hidden sm:block ${index === currentStep
                                        ? 'text-neutral-900 font-medium'
                                        : 'text-neutral-500'
                                    }`}
                            >
                                {title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-2xl shadow-soft p-6 sm:p-8 mb-6">
                {children}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onBack}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2"
                >
                    <ChevronLeft size={18} />
                    Back
                </Button>

                {!isLastStep && (
                    <Button
                        type="button"
                        onClick={onNext}
                        disabled={!canGoNext}
                        className="flex items-center gap-2"
                    >
                        Next
                        <ChevronRight size={18} />
                    </Button>
                )}
            </div>
        </div>
    );
};
