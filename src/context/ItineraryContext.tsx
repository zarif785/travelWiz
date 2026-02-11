import React, { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Itinerary } from '@/types/itinerary';

const ITINERARY_STORAGE_KEY = 'travelai_itineraries';

interface ItineraryContextType {
    currentItinerary: Itinerary | null;
    saveItinerary: (itinerary: Itinerary) => void;
    getItineraryById: (id: string) => Itinerary | null;
}

const ItineraryContext = createContext<ItineraryContextType | undefined>(undefined);

function loadAll(): Record<string, Itinerary> {
    try {
        const raw = localStorage.getItem(ITINERARY_STORAGE_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as Record<string, Itinerary>;
    } catch (error) {
        console.error('Failed to load itineraries from localStorage', error);
        return {};
    }
}

function saveAll(data: Record<string, Itinerary>): void {
    try {
        localStorage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save itineraries to localStorage', error);
    }
}

export const ItineraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cache, setCache] = useState<Record<string, Itinerary>>(() => loadAll());
    const [currentItineraryId, setCurrentItineraryId] = useState<string | null>(null);

    const saveItinerary = (itinerary: Itinerary) => {
        setCache((previous) => {
            const next = { ...previous, [itinerary.id]: itinerary };
            saveAll(next);
            return next;
        });
        setCurrentItineraryId(itinerary.id);
    };

    const getItineraryById = (id: string): Itinerary | null => cache[id] ?? null;

    const value = useMemo<ItineraryContextType>(
        () => ({
            currentItinerary: currentItineraryId ? cache[currentItineraryId] ?? null : null,
            saveItinerary,
            getItineraryById,
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
