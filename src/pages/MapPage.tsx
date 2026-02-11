import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, EmptyState } from '@/components/ui';
import { useItinerary } from '@/context';
import { MapFilters } from '@/components/map/MapFilters';
import { MapView } from '@/components/map/MapView';
import { PlaceDrawer } from '@/components/map/PlaceDrawer';
import { usePinsFromItinerary } from '@/components/map/usePinsFromItinerary';

export const MapPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentItinerary, getItineraryById } = useItinerary();
    const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
    const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

    const itinerary = useMemo(() => {
        if (id) return getItineraryById(id);
        return currentItinerary;
    }, [id, getItineraryById, currentItinerary]);

    const { pins, isLoading, isError, errorMessage, unresolvedCount, unresolvedDetails } =
        usePinsFromItinerary(itinerary);

    const dayOptions = useMemo(
        () => (itinerary ? itinerary.days.map((day) => day.dayNumber) : []),
        [itinerary]
    );

    const filteredPins = useMemo(() => {
        if (selectedDay === 'all') return pins;
        return pins.filter((pin) => pin.references.some((ref) => ref.dayNumber === selectedDay));
    }, [pins, selectedDay]);

    const selectedPin = useMemo(
        () => filteredPins.find((pin) => pin.id === selectedPinId) ?? null,
        [filteredPins, selectedPinId]
    );

    if (!itinerary) {
        return (
            <Container>
                <div className="py-10">
                    <EmptyState
                        title="No itinerary loaded"
                        description="Generate an itinerary first, then open the map."
                        actionLabel="Go to planner"
                        onAction={() => navigate('/plan')}
                        icon={<span className="text-5xl">🗺️</span>}
                    />
                </div>
            </Container>
        );
    }

    return (
        <Container>
            <div className="py-8 space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">Itinerary Map</h1>
                        <p className="text-neutral-600 mt-1">{itinerary.destinationSummary}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate(`/itinerary/${itinerary.id}`)}
                        className="text-sm rounded-lg border border-neutral-300 px-3 py-2"
                    >
                        Back to Itinerary
                    </button>
                </div>

                <MapFilters
                    dayOptions={dayOptions}
                    selectedDay={selectedDay}
                    onDayChange={(day) => {
                        setSelectedDay(day);
                        setSelectedPinId(null);
                    }}
                />

                {isLoading && (
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                        Resolving place coordinates...
                    </div>
                )}

                {isError && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                        Some places could not be located. Pins with candidate coordinates are still shown.
                        {errorMessage ? ` (${errorMessage})` : ''}
                    </div>
                )}
                {!isError && unresolvedCount > 0 && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                        {unresolvedCount} place{unresolvedCount > 1 ? 's' : ''} could not be located exactly.
                        Other pins are still shown.
                        {unresolvedDetails.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {unresolvedDetails.slice(0, 4).map((detail) => (
                                    <p key={detail.placeQuery} className="text-xs text-amber-900">
                                        • {detail.placeQuery}: {detail.reason}
                                    </p>
                                ))}
                                {unresolvedDetails.length > 4 && (
                                    <p className="text-xs text-amber-900">
                                        ...and {unresolvedDetails.length - 4} more unresolved places.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="grid lg:grid-cols-[1fr_360px] gap-4">
                    <MapView
                        pins={filteredPins}
                        selectedPinId={selectedPinId}
                        onSelectPin={setSelectedPinId}
                    />
                    <PlaceDrawer pin={selectedPin} onClose={() => setSelectedPinId(null)} />
                </div>
            </div>
        </Container>
    );
};
