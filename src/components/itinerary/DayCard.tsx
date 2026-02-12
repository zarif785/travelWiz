import React from 'react';
import { Card } from '@/components/ui';
import type { Activity, DayPlan } from '@/types/itinerary';
import { computeSectionCost } from '@/utils/itineraryCost';
import { SectionTimeline, type SectionKey } from './SectionTimeline';

interface DayCardProps {
    day: DayPlan;
    isExpanded: boolean;
    isSectionExpanded: (section: SectionKey) => boolean;
    onToggleDay: () => void;
    onToggleSection: (section: SectionKey) => void;
    onAddActivity: (section: SectionKey) => void;
    onRemoveActivity: (section: SectionKey, activityId: string) => void;
    onReplaceActivity: (section: SectionKey, activity: Activity) => void;
}

const SECTION_META: Array<{ key: SectionKey; label: string }> = [
    { key: 'morning', label: 'Morning' },
    { key: 'afternoon', label: 'Afternoon' },
    { key: 'evening', label: 'Evening' },
];

export const DayCard: React.FC<DayCardProps> = ({
    day,
    isExpanded,
    isSectionExpanded,
    onToggleDay,
    onToggleSection,
    onAddActivity,
    onRemoveActivity,
    onReplaceActivity,
}) => {
    return (
        <Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                    type="button"
                    className="text-left"
                    onClick={onToggleDay}
                    aria-expanded={isExpanded}
                >
                    <h3 className="text-lg font-semibold text-neutral-900">
                        Day {day.dayNumber}
                        {day.theme ? ` • ${day.theme}` : ''}
                    </h3>
                    <p className="text-sm text-neutral-500">{day.date ?? 'Date flexible'}</p>
                </button>
                <button
                    type="button"
                    className="text-sm px-3 py-1 rounded-md border border-neutral-300 self-start sm:self-auto"
                    onClick={onToggleDay}
                >
                    {isExpanded ? 'Collapse' : 'Expand'}
                </button>
            </div>

            {isExpanded && (
                <div className="mt-4 grid md:grid-cols-3 gap-4">
                    {SECTION_META.map((meta) => (
                        <SectionTimeline
                            key={`${day.dayNumber}-${meta.key}`}
                            dayNumber={day.dayNumber}
                            section={meta.key}
                            title={meta.label}
                            activities={day[meta.key]}
                            sectionCost={computeSectionCost(day, meta.key)}
                            isExpanded={isSectionExpanded(meta.key)}
                            onToggle={() => onToggleSection(meta.key)}
                            onAdd={() => onAddActivity(meta.key)}
                            onRemoveActivity={(activityId) => onRemoveActivity(meta.key, activityId)}
                            onReplaceActivity={(activity) => onReplaceActivity(meta.key, activity)}
                        />
                    ))}
                </div>
            )}
        </Card>
    );
};
