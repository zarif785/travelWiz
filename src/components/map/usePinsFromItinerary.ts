import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Itinerary } from '@/types/itinerary';
import type { MapPin, PlaceResolveQuery } from '@/types/map';
import { resolvePlacesRequestWithMeta } from '@/services/placesApi';

type SectionKey = 'morning' | 'afternoon' | 'evening';
const SECTIONS: SectionKey[] = ['morning', 'afternoon', 'evening'];

function normalizePlaceQuery(value: string): string {
    return value.trim().toLowerCase();
}

function createStableHash(value: string): string {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(index);
        hash |= 0;
    }
    return Math.abs(hash).toString(16);
}

function buildBasePins(itinerary: Itinerary): {
    pins: MapPin[];
    resolveQueries: PlaceResolveQuery[];
} {
    const byQuery = new Map<string, MapPin>();
    const resolveQueries: PlaceResolveQuery[] = [];

    itinerary.days.forEach((day) => {
        SECTIONS.forEach((section) => {
            day[section].forEach((activity) => {
                const normalizedQuery = normalizePlaceQuery(activity.placeQuery);
                if (!normalizedQuery) return;

                const ref = {
                    dayNumber: day.dayNumber,
                    section,
                    activityId: activity.id,
                    activityName: activity.name,
                };

                const existing = byQuery.get(normalizedQuery);
                if (existing) {
                    existing.references.push(ref);
                    existing.tags = Array.from(new Set([...existing.tags, ...activity.tags]));
                    return;
                }

                const lat = activity.coordinatesCandidate?.lat ?? 0;
                const lng = activity.coordinatesCandidate?.lng ?? 0;
                const hasCandidate = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;

                const basePin: MapPin = {
                    id: createStableHash(normalizedQuery),
                    name: activity.name,
                    area: activity.area,
                    placeQuery: activity.placeQuery,
                    lat: hasCandidate ? lat : 0,
                    lng: hasCandidate ? lng : 0,
                    tags: Array.from(new Set(activity.tags)),
                    references: [ref],
                    source: hasCandidate ? 'candidate' : undefined,
                };

                byQuery.set(normalizedQuery, basePin);
                resolveQueries.push({
                    placeQuery: activity.placeQuery,
                    area: activity.area,
                    hintLat: activity.coordinatesCandidate?.lat,
                    hintLng: activity.coordinatesCandidate?.lng,
                });
            });
        });
    });

    return {
        pins: Array.from(byQuery.values()),
        resolveQueries,
    };
}

interface UsePinsFromItineraryResult {
    pins: MapPin[];
    isLoading: boolean;
    isError: boolean;
    errorMessage?: string;
    unresolvedCount: number;
    unresolvedDetails: Array<{ placeQuery: string; reason: string }>;
}

export function usePinsFromItinerary(itinerary: Itinerary | null): UsePinsFromItineraryResult {
    const base = useMemo(() => {
        if (!itinerary) return { pins: [], resolveQueries: [] };
        return buildBasePins(itinerary);
    }, [itinerary]);

    const resolveQuery = useQuery({
        queryKey: ['placeResolve', itinerary?.id, base.resolveQueries.map((q) => q.placeQuery).join('|')],
        queryFn: async () => resolvePlacesRequestWithMeta(base.resolveQueries),
        enabled: !!itinerary && base.resolveQueries.length > 0,
        staleTime: 24 * 60 * 60 * 1000,
    });

    const pins = useMemo(() => {
        if (base.pins.length === 0) return [];

        if (!resolveQuery.data) {
            return base.pins.filter((pin) => Number.isFinite(pin.lat) && Number.isFinite(pin.lng) && pin.lat !== 0 && pin.lng !== 0);
        }

        const resolvedMap = new Map(
            resolveQuery.data.results.map((item) => [normalizePlaceQuery(item.placeQuery), item])
        );

        return base.pins
            .map((pin) => {
                const resolved = resolvedMap.get(normalizePlaceQuery(pin.placeQuery));
                if (!resolved) return pin;
                return {
                    ...pin,
                    name: resolved.name || pin.name,
                    lat: resolved.lat,
                    lng: resolved.lng,
                    source: resolved.source,
                    media: {
                        images: resolved.images,
                        highlights: resolved.highlights,
                    },
                } satisfies MapPin;
            })
            .filter((pin) => Number.isFinite(pin.lat) && Number.isFinite(pin.lng) && pin.lat !== 0 && pin.lng !== 0);
    }, [base.pins, resolveQuery.data]);

    const unresolvedCount = useMemo(() => {
        if (!resolveQuery.data) return 0;
        return resolveQuery.data.meta?.unresolvedCount ?? 0;
    }, [resolveQuery.data]);

    const unresolvedDetails = useMemo(() => {
        if (!resolveQuery.data) return [];
        return resolveQuery.data.meta?.unresolved ?? [];
    }, [resolveQuery.data]);

    return {
        pins,
        isLoading: resolveQuery.isLoading,
        isError: resolveQuery.isError,
        errorMessage: resolveQuery.error instanceof Error ? resolveQuery.error.message : undefined,
        unresolvedCount,
        unresolvedDetails,
    };
}
