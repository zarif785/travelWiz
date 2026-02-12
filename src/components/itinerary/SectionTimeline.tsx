import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Activity } from '@/types/itinerary';
import { Button } from '@/components/ui';
import { ActivityCard } from './ActivityCard';

export type SectionKey = 'morning' | 'afternoon' | 'evening';

interface SectionTimelineProps {
    dayNumber: number;
    section: SectionKey;
    title: string;
    activities: Activity[];
    sectionCost: number;
    isExpanded: boolean;
    onToggle: () => void;
    onAdd: () => void;
    onRemoveActivity: (activityId: string) => void;
    onReplaceActivity: (activity: Activity) => void;
}

export function getSectionContainerId(dayNumber: number, section: SectionKey): string {
    return `section-${dayNumber}-${section}`;
}

export const SectionTimeline: React.FC<SectionTimelineProps> = ({
    dayNumber,
    section,
    title,
    activities,
    sectionCost,
    isExpanded,
    onToggle,
    onAdd,
    onRemoveActivity,
    onReplaceActivity,
}) => {
    const containerId = getSectionContainerId(dayNumber, section);
    const { setNodeRef, isOver } = useDroppable({ id: containerId });

    return (
        <div className="rounded-xl border border-neutral-200 p-3 bg-neutral-50">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                    type="button"
                    className="text-left min-w-0"
                    onClick={onToggle}
                    aria-expanded={isExpanded}
                >
                    <h4 className="text-sm uppercase tracking-wide text-neutral-500">{title}</h4>
                    <p className="text-xs text-neutral-500">
                        {activities.length} activities • {Math.round(sectionCost)}
                    </p>
                </button>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                    <Button size="sm" variant="secondary" className="flex-1 sm:flex-none" onClick={onAdd}>
                        Add activity
                    </Button>
                    <Button size="sm" variant="secondary" className="flex-1 sm:flex-none" onClick={onToggle}>
                        {isExpanded ? 'Collapse' : 'Expand'}
                    </Button>
                </div>
            </div>

            {isExpanded && (
                <div ref={setNodeRef} className={`mt-3 min-h-12 rounded-xl ${isOver ? 'ring-2 ring-primary-300' : ''}`}>
                    <SortableContext
                        id={containerId}
                        items={activities.map((activity) => activity.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-3">
                            {activities.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 bg-white">
                                    No activity set.
                                </div>
                            ) : (
                                activities.map((activity) => (
                                    <ActivityCard
                                        key={activity.id}
                                        activity={activity}
                                        onRemove={() => onRemoveActivity(activity.id)}
                                        onReplace={() => onReplaceActivity(activity)}
                                    />
                                ))
                            )}
                        </div>
                    </SortableContext>
                </div>
            )}
        </div>
    );
};
