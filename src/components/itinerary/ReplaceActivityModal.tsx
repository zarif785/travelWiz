import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import type { Activity } from '@/types/itinerary';

interface ReplaceActivityModalProps {
    isOpen: boolean;
    activity: Activity | null;
    dayNumber: number | null;
    sectionLabel?: string;
    isLoading?: boolean;
    onClose: () => void;
    onSubmit: (instruction: string) => void;
}

const QUICK_OPTIONS = [
    'Cheaper',
    'More relaxing',
    'More adventurous',
    'Indoor',
    'Nearby',
];

export const ReplaceActivityModal: React.FC<ReplaceActivityModalProps> = ({
    isOpen,
    activity,
    dayNumber,
    sectionLabel,
    isLoading = false,
    onClose,
    onSubmit,
}) => {
    const [instruction, setInstruction] = useState('');

    const quickPrefix = useMemo(() => {
        if (!activity || !dayNumber) return '';
        return `Replace Day ${dayNumber} ${sectionLabel ?? 'section'} activity "${activity.name}" with `;
    }, [activity, dayNumber, sectionLabel]);

    if (!isOpen || !activity || !dayNumber) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
                <h3 className="text-lg font-semibold text-neutral-900">Replace activity with AI</h3>
                <div className="mt-3 rounded-xl border border-neutral-200 p-3 bg-neutral-50">
                    <p className="text-sm font-medium text-neutral-800">{activity.name}</p>
                    <p className="text-sm text-neutral-600 mt-1">{activity.description}</p>
                    <p className="text-xs text-neutral-500 mt-2">
                        Day {dayNumber} • {sectionLabel} • {activity.area}
                    </p>
                </div>

                <div className="mt-4 space-y-3">
                    <input
                        className="w-full rounded-xl border-2 border-neutral-200 px-3 py-2"
                        placeholder="What do you want instead?"
                        value={instruction}
                        onChange={(event) => setInstruction(event.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                        {QUICK_OPTIONS.map((option) => (
                            <button
                                key={option}
                                type="button"
                                className="text-xs px-2 py-1 rounded-full border border-neutral-300 bg-white"
                                onClick={() => setInstruction(`${quickPrefix}${option.toLowerCase()} alternative.`)}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        className="rounded-xl border border-neutral-300 px-4 py-2"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <Button
                        onClick={() => onSubmit(instruction.trim())}
                        isLoading={isLoading}
                        disabled={!instruction.trim()}
                    >
                        Replace activity
                    </Button>
                </div>
            </div>
        </div>
    );
};
