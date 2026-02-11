import type { TripProfile } from '@/types/trip';
import type { Itinerary, RefineType } from '@/types/itinerary';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

interface ItineraryMeta {
    model: string;
    tokens?: number;
    createdAt: string;
    warnings?: string[];
}

interface ItineraryResponse {
    itinerary: Itinerary;
    meta: ItineraryMeta;
}

interface ApiErrorBody {
    error?: string;
}

async function safeParseError(response: Response): Promise<string> {
    try {
        const body = (await response.json()) as ApiErrorBody;
        return body.error || `Request failed (${response.status})`;
    } catch {
        return `Request failed (${response.status})`;
    }
}

export async function generateItineraryRequest(payload: {
    tripProfile: TripProfile;
}): Promise<ItineraryResponse> {
    const response = await fetch(`${API_BASE_URL}/itinerary/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(await safeParseError(response));
    }

    return (await response.json()) as ItineraryResponse;
}

export async function refineItineraryRequest(payload: {
    tripProfile: TripProfile;
    currentItinerary: Itinerary;
    instruction?: string;
    refine?: RefineType;
}): Promise<ItineraryResponse> {
    const response = await fetch(`${API_BASE_URL}/itinerary/refine`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(await safeParseError(response));
    }

    return (await response.json()) as ItineraryResponse;
}
