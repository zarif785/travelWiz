import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Container, PageWrapper, EmptyState, Card, Button } from '@/components/ui';
import { useNavigate } from 'react-router-dom';
import { useAuth, useItinerary, useTripProfile } from '@/context';
import { deleteTripProfile } from '@/utils/storage';
import { generateItineraryRequest } from '@/services/itineraryApi';
import type { TripProfile } from '@/types/trip';

export const MyTrips: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { allTripProfiles, refreshTrips } = useTripProfile();
    const { saveItinerary } = useItinerary();
    const [error, setError] = useState<string | null>(null);
    const [generatingTripId, setGeneratingTripId] = useState<string | null>(null);

    const generateMutation = useMutation({
        mutationFn: async (tripProfile: TripProfile) => generateItineraryRequest({ tripProfile }),
        onMutate: (tripProfile) => {
            setError(null);
            setGeneratingTripId(tripProfile.id);
        },
        onSuccess: (response) => {
            saveItinerary(response.itinerary);
            navigate(`/itinerary/${response.itinerary.id}`);
        },
        onError: (mutationError) => {
            setError(
                mutationError instanceof Error
                    ? mutationError.message
                    : 'Could not generate itinerary right now.'
            );
        },
        onSettled: () => {
            setGeneratingTripId(null);
        },
    });

    const handleDeleteTrip = (id: string) => {
        if (!confirm('Delete this saved trip profile?')) return;
        deleteTripProfile(id);
        refreshTrips();
    };

    if (allTripProfiles.length === 0) {
        return (
            <Container>
                <PageWrapper title="My Trips">
                    <EmptyState
                        icon={
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                        }
                        title="No Trips Yet"
                        description="You haven't created any trips yet. Start planning your first adventure!"
                        actionLabel="Plan a Trip"
                        onAction={() => navigate('/plan')}
                    />
                </PageWrapper>
            </Container>
        );
    }

    return (
        <Container>
            <PageWrapper title="My Trips">
                {!isAuthenticated && (
                    <Card className="mb-4 border border-amber-200 bg-amber-50">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <p className="text-sm text-amber-900">
                                You are browsing as guest. Trips are saved to this browser only.
                            </p>
                            <Button size="sm" variant="secondary" onClick={() => navigate('/auth')}>
                                Login / Signup
                            </Button>
                        </div>
                    </Card>
                )}
                <div className="space-y-4">
                    {allTripProfiles
                        .slice()
                        .reverse()
                        .map((trip) => (
                            <Card key={trip.id}>
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-neutral-900">
                                            {trip.destinations.map((d) => `${d.city}, ${d.country}`).join(' • ')}
                                        </h3>
                                        <p className="text-sm text-neutral-600 mt-1">
                                            {trip.durationDays} days • {trip.currency} {Math.round(trip.budgetTotal)}
                                        </p>
                                        <p className="text-sm text-neutral-500 mt-1">
                                            Created {new Date(trip.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            onClick={() => generateMutation.mutate(trip)}
                                            isLoading={generatingTripId === trip.id}
                                        >
                                            Generate Itinerary
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => handleDeleteTrip(trip.id)}
                                            disabled={generatingTripId === trip.id}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                </div>
                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            </PageWrapper>
        </Container>
    );
};
