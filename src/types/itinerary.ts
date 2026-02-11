export interface Itinerary {
    id: string;
    tripId?: string;
    destinationSummary: string;
    totals: {
        estimatedTotalCost: number;
        estimatedDailyAverageCost: number;
        currency: string;
        costNotes?: string;
    };
    days: DayPlan[];
    places: PlaceCandidate[];
    warnings?: string[];
}

export interface DayPlan {
    dayNumber: number;
    date?: string;
    theme?: string;
    morning: Activity[];
    afternoon: Activity[];
    evening: Activity[];
}

export interface Activity {
    id: string;
    name: string;
    description: string;
    area: string;
    durationMinutes: number;
    estimatedCost: number;
    costType: 'free' | 'low' | 'mid' | 'high';
    tags: string[];
    placeQuery: string;
    coordinatesCandidate?: { lat: number; lng: number };
    travelNotes?: string;
}

export interface PlaceCandidate {
    placeId: string;
    name: string;
    area: string;
    placeQuery: string;
    coordinatesCandidate?: { lat: number; lng: number };
    tags: string[];
}

export type RefineType =
    | { type: 'cheaper' }
    | { type: 'more_adventure' }
    | { type: 'swap_days'; dayA: number; dayB: number }
    | { type: 'add_free_activities' }
    | { type: 'reduce_walking' };
