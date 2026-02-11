import React, { useEffect, useState } from 'react';
import type { Activity } from '@/types/itinerary';

interface EditActivityModalProps {
    isOpen: boolean;
    activity: Activity | null;
    onClose: () => void;
    onSave: (updated: Activity) => void;
}

function inferCostType(cost: number): Activity['costType'] {
    if (cost <= 0) return 'free';
    if (cost <= 30) return 'low';
    if (cost <= 100) return 'mid';
    return 'high';
}

export const EditActivityModal: React.FC<EditActivityModalProps> = ({
    isOpen,
    activity,
    onClose,
    onSave,
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [area, setArea] = useState('');
    const [durationMinutes, setDurationMinutes] = useState(90);
    const [estimatedCost, setEstimatedCost] = useState(0);
    const [tagsText, setTagsText] = useState('');
    const [placeQuery, setPlaceQuery] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!activity) return;
        setName(activity.name);
        setDescription(activity.description);
        setArea(activity.area);
        setDurationMinutes(activity.durationMinutes);
        setEstimatedCost(activity.estimatedCost);
        setTagsText(activity.tags.join(', '));
        setPlaceQuery(activity.placeQuery);
        setError(null);
    }, [activity]);

    if (!isOpen || !activity) return null;

    const handleSave = () => {
        if (!name.trim() || !area.trim() || !placeQuery.trim()) {
            setError('Name, area and place query are required.');
            return;
        }

        const tags = tagsText
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

        onSave({
            ...activity,
            name: name.trim(),
            description: description.trim() || `${name.trim()} in ${area.trim()}.`,
            area: area.trim(),
            durationMinutes: Math.max(1, Math.round(durationMinutes)),
            estimatedCost: Math.max(0, estimatedCost),
            costType: inferCostType(Math.max(0, estimatedCost)),
            tags,
            placeQuery: placeQuery.trim(),
        });

        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
                <h3 className="text-lg font-semibold text-neutral-900">Edit activity</h3>
                <div className="mt-4 space-y-3">
                    <input
                        className="w-full rounded-xl border-2 border-neutral-200 px-3 py-2"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />
                    <textarea
                        className="w-full rounded-xl border-2 border-neutral-200 px-3 py-2"
                        rows={3}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                    />
                    <input
                        className="w-full rounded-xl border-2 border-neutral-200 px-3 py-2"
                        value={area}
                        onChange={(event) => setArea(event.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            className="w-full rounded-xl border-2 border-neutral-200 px-3 py-2"
                            type="number"
                            min={1}
                            value={durationMinutes}
                            onChange={(event) => setDurationMinutes(Number(event.target.value))}
                        />
                        <input
                            className="w-full rounded-xl border-2 border-neutral-200 px-3 py-2"
                            type="number"
                            min={0}
                            value={estimatedCost}
                            onChange={(event) => setEstimatedCost(Number(event.target.value))}
                        />
                    </div>
                    <input
                        className="w-full rounded-xl border-2 border-neutral-200 px-3 py-2"
                        value={tagsText}
                        onChange={(event) => setTagsText(event.target.value)}
                    />
                    <input
                        className="w-full rounded-xl border-2 border-neutral-200 px-3 py-2"
                        value={placeQuery}
                        onChange={(event) => setPlaceQuery(event.target.value)}
                    />
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        className="rounded-xl border border-neutral-300 px-4 py-2"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="rounded-xl bg-primary-500 text-white px-4 py-2"
                        onClick={handleSave}
                    >
                        Save changes
                    </button>
                </div>
            </div>
        </div>
    );
};
