import React, { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Itinerary } from '@/types/itinerary';
import { withRecomputedTotals } from '@/utils/itineraryCost';

const ITINERARY_STORAGE_KEY = 'travelai_itineraries';

interface ItineraryContextType {
    currentItinerary: Itinerary | null;
    itineraryMap: Record<string, Itinerary>;
    saveItinerary: (itinerary: Itinerary) => void;
    setItinerary: (itinerary: Itinerary) => void;
    getItineraryById: (id: string) => Itinerary | null;
    getItineraryByTripId: (tripId: string) => Itinerary | null;
    loadItineraryLocal: (id: string) => Itinerary | null;
    saveItineraryLocal: (itinerary: Itinerary) => void;
}

const ItineraryContext = createContext<ItineraryContextType | undefined>(undefined);

function loadAllItineraries(): Record<string, Itinerary> {
    try {
        const raw = localStorage.getItem(ITINERARY_STORAGE_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as Record<string, Itinerary>;
    } catch (error) {
        console.error('Failed to load itineraries from localStorage', error);
        return {};
    }
}

function saveAllItineraries(data: Record<string, Itinerary>): void {
    try {
        localStorage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save itineraries to localStorage', error);
    }
}

export const ItineraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cache, setCache] = useState<Record<string, Itinerary>>(() => loadAllItineraries());
    const [currentItineraryId, setCurrentItineraryId] = useState<string | null>(null);

    const saveItineraryLocal = (itinerary: Itinerary) => {
        const normalized = withRecomputedTotals(itinerary);
        setCache((previous) => {
            const next = { ...previous, [normalized.id]: normalized };
            saveAllItineraries(next);
            return next;
        });
        setCurrentItineraryId(normalized.id);
    };

    const loadItineraryLocal = (id: string): Itinerary | null => {
        const map = loadAllItineraries();
        return map[id] ?? null;
    };

    const saveItinerary = (itinerary: Itinerary) => {
        saveItineraryLocal(itinerary);
    };

    const setItinerary = (itinerary: Itinerary) => {
        saveItineraryLocal(itinerary);
    };

    const getItineraryById = (id: string): Itinerary | null => {
        const inMemory = cache[id];
        if (inMemory) return inMemory;
        return loadItineraryLocal(id);
    };

    const getItineraryByTripId = (tripId: string): Itinerary | null => {
        const inMemoryMatch = Object.values(cache).find((itinerary) => itinerary.tripId === tripId);
        if (inMemoryMatch) return inMemoryMatch;
        const fromStorage = loadAllItineraries();
        return Object.values(fromStorage).find((itinerary) => itinerary.tripId === tripId) ?? null;
    };

    const value = useMemo<ItineraryContextType>(
        () => ({
            currentItinerary: currentItineraryId ? cache[currentItineraryId] ?? null : null,
            itineraryMap: cache,
            saveItinerary,
            setItinerary,
            getItineraryById,
            getItineraryByTripId,
            loadItineraryLocal,
            saveItineraryLocal,
        }),
        [cache, currentItineraryId]
    );

    return <ItineraryContext.Provider value={value}>{children}</ItineraryContext.Provider>;
};

export const useItinerary = (): ItineraryContextType => {
    const context = useContext(ItineraryContext);
    if (!context) {
        throw new Error('useItinerary must be used within ItineraryProvider');
    }
    return context;
};

export { loadAllItineraries, saveAllItineraries };
