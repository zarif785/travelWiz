import React, { useMemo, useState } from 'react';
import type { Activity } from '@/types/itinerary';
import type { SectionKey } from './SectionTimeline';
import { createUuid } from '@/utils/uuid';

interface AddActivityModalProps {
    isOpen: boolean;
    dayNumber: number | null;
    section: SectionKey | null;
    onClose: () => void;
    onSave: (activity: Activity, section: SectionKey, dayNumber: number) => void;
}

function inferCostType(cost: number): Activity['costType'] {
    if (cost <= 0) return 'free';
    if (cost <= 30) return 'low';
    if (cost <= 100) return 'mid';
    return 'high';
}

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
    isOpen,
    dayNumber,
    section,
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

    const title = useMemo(() => {
        if (!dayNumber || !section) return 'Add activity';
        return `Add activity to Day ${dayNumber} (${section})`;
    }, [dayNumber, section]);

    if (!isOpen || !dayNumber || !section) return null;

    const resetAndClose = () => {
        setName('');
        setDescription('');
        setArea('');
        setDurationMinutes(90);
        setEstimatedCost(0);
        setTagsText('');
        setPlaceQuery('');
        setError(null);
        onClose();
    };

    const handleSave = () => {
        if (!name.trim()) {
            setError('Name is required.');
            return;
        }
        if (!area.trim()) {
            setError('Area is required.');
            return;
        }
        if (!placeQuery.trim()) {
            setError('placeQuery is required.');
            return;
        }
        if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
            setError('Duration must be greater than 0.');
            return;
        }

        const tags = tagsText
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

        const activity: Activity = {
            id: createUuid(),
            name: name.trim(),
            description: description.trim() || `${name.trim()} in ${area.trim()}.`,
            area: area.trim(),
            durationMinutes: Math.round(durationMinutes),
            estimatedCost: Math.max(0, estimatedCost),
            costType: inferCostType(Math.max(0, estimatedCost)),
            tags,
            placeQuery: placeQuery.trim(),
        };

        onSave(activity, section, dayNumber);
        resetAndClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
                <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
                <div className="mt-4 space-y-3">
                    <input
                        className="w-full rounded-xl border-2 border-neutral-200 px-3 py-2"
                        placeholder="Activity name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />
                    <textarea
                        className="w-full rounded-xl border-2 border-neutral-200 px-3 py-2"
                        rows={3}
                        placeholder="Description (optional)"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                    />
                    <input
                        className="w-full rounded-xl border-2 border-neutral-200 px-3 py-2"
                        placeholder="Area / neighborhood"
                        value={area}
                        onChange={(event) => setArea(event.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            className="w-full rounded-xl border-2 border-neutral-200 px-3 py-2"
                            type="number"
                            min={1}
                            placeholder="Duration minutes"
                            value={durationMinutes}
                            onChange={(event) => setDurationMinutes(Number(event.target.value))}
                        />
                        <input
                            className="w-full rounded-xl border-2 border-neutral-200 px-3 py-2"
                            type="number"
                            min={0}
                            placeholder="Estimated cost"
                            value={estimatedCost}
                            onChange={(event) => setEstimatedCost(Number(event.target.value))}
                        />
                    </div>
                    <input
                        className="w-full rounded-xl border-2 border-neutral-200 px-3 py-2"
                        placeholder="Tags (comma separated)"
                        value={tagsText}
                        onChange={(event) => setTagsText(event.target.value)}
                    />
                    <input
                        className="w-full rounded-xl border-2 border-neutral-200 px-3 py-2"
                        placeholder="Place query (for maps)"
                        value={placeQuery}
                        onChange={(event) => setPlaceQuery(event.target.value)}
                    />
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        className="rounded-xl border border-neutral-300 px-4 py-2"
                        onClick={resetAndClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="rounded-xl bg-primary-500 text-white px-4 py-2"
                        onClick={handleSave}
                    >
                        Add activity
                    </button>
                </div>
            </div>
        </div>
    );
};
