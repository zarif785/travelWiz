import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Activity } from '@/types/itinerary';
import { Button } from '@/components/ui';

interface ActivityCardProps {
    activity: Activity;
    onRemove: () => void;
    onReplace: () => void;
    onEdit: () => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
    activity,
    onRemove,
    onReplace,
    onEdit,
}) => {
    const [expanded, setExpanded] = useState(false);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: activity.id });

    return (
        <div className="relative pl-6">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-neutral-200"></div>
            <div className="absolute left-0 top-5 h-4 w-4 rounded-full border-2 border-primary-500 bg-white"></div>
            <div
                ref={setNodeRef}
                style={{
                    transform: CSS.Transform.toString(transform),
                    transition,
                    opacity: isDragging ? 0.7 : 1,
                }}
                className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h5 className="font-semibold text-neutral-900">{activity.name}</h5>
                        <p className={`text-sm text-neutral-600 mt-1 ${expanded ? '' : 'line-clamp-2'}`}>
                            {activity.description}
                        </p>
                        {activity.description.length > 120 && (
                            <button
                                type="button"
                                className="text-xs text-primary-700 mt-1"
                                onClick={() => setExpanded((value) => !value)}
                            >
                                {expanded ? 'Show less' : 'Read more'}
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        className="text-xs rounded-md border border-neutral-300 px-2 py-1 bg-neutral-50 cursor-grab active:cursor-grabbing"
                        aria-label="Drag activity"
                        {...attributes}
                        {...listeners}
                    >
                        Drag
                    </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-700">
                    <span className="px-2 py-1 rounded-full bg-primary-50 text-primary-700">{activity.area}</span>
                    <span className="px-2 py-1 rounded-full bg-neutral-100">{activity.durationMinutes} min</span>
                    <span className="px-2 py-1 rounded-full bg-neutral-100">
                        {activity.costType} • {Math.round(activity.estimatedCost)}
                    </span>
                </div>

                {activity.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {activity.tags.map((tag) => (
                            <span key={`${activity.id}-${tag}`} className="px-2 py-1 text-xs rounded-full bg-neutral-100 text-neutral-700">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={onEdit}>
                        Edit
                    </Button>
                    <Button size="sm" variant="secondary" onClick={onReplace}>
                        Replace
                    </Button>
                    <Button size="sm" variant="secondary" onClick={onRemove}>
                        Remove
                    </Button>
                    <button
                        type="button"
                        className="text-xs px-2 py-1 rounded-md border border-neutral-300 text-neutral-700 bg-neutral-50"
                    >
                        Map
                    </button>
                </div>
            </div>
        </div>
    );
};
