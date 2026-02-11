import React, { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Container, Input, Button, EmptyState } from '@/components/ui';
import { useItinerary, useTripProfile } from '@/context';
import { getTripProfile } from '@/utils/storage';
import { refineItineraryRequest } from '@/services/itineraryApi';
import type { Itinerary, RefineType, Activity } from '@/types/itinerary';

const SECTION_LABELS: Array<{
    key: 'morning' | 'afternoon' | 'evening';
    label: string;
}> = [
    { key: 'morning', label: 'Morning' },
    { key: 'afternoon', label: 'Afternoon' },
    { key: 'evening', label: 'Evening' },
];

function formatCurrency(amount: number, currency: string): string {
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency,
            maximumFractionDigits: 0,
        }).format(amount);
    } catch {
        return `${currency} ${Math.round(amount)}`;
    }
}

function renderActivity(activity: Activity): React.ReactNode {
    return (
        <div key={activity.id} className="rounded-xl border border-neutral-200 p-4 bg-white">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h5 className="font-semibold text-neutral-900">{activity.name}</h5>
                    <p className="text-sm text-neutral-600 mt-1">{activity.description}</p>
                </div>
                <button
                    type="button"
                    className="text-xs px-2 py-1 rounded-md border border-neutral-300 text-neutral-700 bg-neutral-50"
                >
                    Map
                </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-700">
                <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-full">{activity.area}</span>
                <span className="px-2 py-1 bg-neutral-100 rounded-full">{activity.durationMinutes} min</span>
                <span className="px-2 py-1 bg-neutral-100 rounded-full">
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
        </div>
    );
}

export const ItineraryResult: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { finalTripProfile } = useTripProfile();
    const { currentItinerary, getItineraryById, saveItinerary } = useItinerary();

    const [freeTextInstruction, setFreeTextInstruction] = useState('');
    const [dayA, setDayA] = useState(1);
    const [dayB, setDayB] = useState(2);
    const [friendlyError, setFriendlyError] = useState<string | null>(null);

    const itinerary: Itinerary | null = useMemo(() => {
        if (id) return getItineraryById(id);
        return currentItinerary;
    }, [currentItinerary, getItineraryById, id]);

    const tripProfile = useMemo(() => {
        if (!itinerary?.tripId) return finalTripProfile;
        return finalTripProfile?.id === itinerary.tripId ? finalTripProfile : getTripProfile(itinerary.tripId);
    }, [finalTripProfile, itinerary?.tripId]);

    const refineMutation = useMutation({
        mutationFn: async (payload: { instruction?: string; refine?: RefineType }) => {
            if (!itinerary || !tripProfile) {
                throw new Error('Trip profile not found for this itinerary.');
            }
            return refineItineraryRequest({
                tripProfile,
                currentItinerary: itinerary,
                instruction: payload.instruction,
                refine: payload.refine,
            });
        },
        onSuccess: (data) => {
            setFriendlyError(null);
            saveItinerary(data.itinerary);
        },
        onError: (error) => {
            setFriendlyError(error instanceof Error ? error.message : 'Could not refine itinerary. Please try again.');
        },
    });

    if (!itinerary) {
        return (
            <Container>
                <div className="py-10">
                    <EmptyState
                        title="No itinerary loaded"
                        description="Generate an itinerary from the planning wizard first."
                        actionLabel="Go to Planner"
                        onAction={() => navigate('/plan')}
                        icon={<span className="text-5xl">🗺️</span>}
                    />
                </div>
            </Container>
        );
    }

    const runPresetRefine = (refine: RefineType) => {
        refineMutation.mutate({ refine });
    };

    const dayCards = useMemo(
        () =>
            itinerary.days.map((day) => (
                <Card key={day.dayNumber}>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-neutral-900">
                            Day {day.dayNumber}
                            {day.theme ? ` • ${day.theme}` : ''}
                        </h3>
                        {day.date && <span className="text-sm text-neutral-500">{day.date}</span>}
                    </div>
                    <div className="mt-4 grid md:grid-cols-3 gap-4">
                        {SECTION_LABELS.map((section) => (
                            <div key={`${day.dayNumber}-${section.key}`}>
                                <h4 className="text-sm uppercase tracking-wide text-neutral-500 mb-2">{section.label}</h4>
                                <div className="space-y-2">
                                    {day[section.key].length > 0 ? (
                                        day[section.key].map((activity) => renderActivity(activity))
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-500">
                                            No activity set
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )),
        [itinerary.days]
    );

    return (
        <Container>
            <div className="py-8 space-y-6">
                <Card>
                    <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">Your Itinerary</h1>
                    <p className="text-neutral-600 mt-2">{itinerary.destinationSummary}</p>
                    <div className="mt-4 grid md:grid-cols-3 gap-3">
                        <div className="rounded-xl bg-neutral-50 p-3">
                            <p className="text-xs uppercase tracking-wide text-neutral-500">Estimated total</p>
                            <p className="text-lg font-semibold text-neutral-900">
                                {formatCurrency(itinerary.totals.estimatedTotalCost, itinerary.totals.currency)}
                            </p>
                        </div>
                        <div className="rounded-xl bg-neutral-50 p-3">
                            <p className="text-xs uppercase tracking-wide text-neutral-500">Daily average</p>
                            <p className="text-lg font-semibold text-neutral-900">
                                {formatCurrency(itinerary.totals.estimatedDailyAverageCost, itinerary.totals.currency)}
                            </p>
                        </div>
                        <div className="rounded-xl bg-neutral-50 p-3">
                            <p className="text-xs uppercase tracking-wide text-neutral-500">Places for map</p>
                            <p className="text-lg font-semibold text-neutral-900">{itinerary.places.length}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <h2 className="text-xl font-semibold text-neutral-900 mb-4">Refine this itinerary</h2>
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => runPresetRefine({ type: 'cheaper' })} isLoading={refineMutation.isPending}>
                            Make it cheaper
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => runPresetRefine({ type: 'more_adventure' })} isLoading={refineMutation.isPending}>
                            More adventure
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => runPresetRefine({ type: 'add_free_activities' })} isLoading={refineMutation.isPending}>
                            Add free activities
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => runPresetRefine({ type: 'reduce_walking' })} isLoading={refineMutation.isPending}>
                            Reduce walking
                        </Button>
                    </div>

                    <div className="mt-4 grid md:grid-cols-3 gap-3 items-end">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Day A</label>
                            <select
                                className="w-full px-3 py-2 border-2 border-neutral-200 rounded-xl"
                                value={dayA}
                                onChange={(e) => setDayA(Number(e.target.value))}
                                disabled={refineMutation.isPending}
                            >
                                {itinerary.days.map((day) => (
                                    <option key={`day-a-${day.dayNumber}`} value={day.dayNumber}>
                                        Day {day.dayNumber}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Day B</label>
                            <select
                                className="w-full px-3 py-2 border-2 border-neutral-200 rounded-xl"
                                value={dayB}
                                onChange={(e) => setDayB(Number(e.target.value))}
                                disabled={refineMutation.isPending}
                            >
                                {itinerary.days.map((day) => (
                                    <option key={`day-b-${day.dayNumber}`} value={day.dayNumber}>
                                        Day {day.dayNumber}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button
                            onClick={() => runPresetRefine({ type: 'swap_days', dayA, dayB })}
                            disabled={dayA === dayB}
                            isLoading={refineMutation.isPending}
                        >
                            Swap
                        </Button>
                    </div>

                    <div className="mt-4 flex flex-col md:flex-row gap-2">
                        <div className="flex-1">
                            <Input
                                placeholder="Change Day 2 evening to a quieter option"
                                value={freeTextInstruction}
                                onChange={(e) => setFreeTextInstruction(e.target.value)}
                                disabled={refineMutation.isPending}
                            />
                        </div>
                        <Button
                            onClick={() => refineMutation.mutate({ instruction: freeTextInstruction.trim() })}
                            disabled={!freeTextInstruction.trim()}
                            isLoading={refineMutation.isPending}
                        >
                            Refine with text
                        </Button>
                    </div>
                    {friendlyError && <p className="mt-3 text-sm text-red-600">{friendlyError}</p>}
                </Card>

                <div className="space-y-4">{dayCards}</div>
            </div>
        </Container>
    );
};
