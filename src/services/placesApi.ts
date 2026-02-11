import type { PlaceResolveItem, PlaceResolveQuery } from '@/types/map';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

interface ApiErrorBody {
    error?: string;
    reason?: string;
}

async function parseApiError(response: Response): Promise<string> {
    try {
        const body = (await response.json()) as ApiErrorBody;
        return body.reason ? `${body.error}: ${body.reason}` : body.error || `Request failed (${response.status})`;
    } catch {
        return `Request failed (${response.status})`;
    }
}

export async function resolvePlacesRequest(queries: PlaceResolveQuery[]): Promise<PlaceResolveItem[]> {
    const response = await fetch(`${API_BASE_URL}/places/resolve`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ queries }),
    });

    if (!response.ok) {
        throw new Error(await parseApiError(response));
    }

    const payload = (await response.json()) as {
        results: PlaceResolveItem[];
        meta?: {
            total: number;
            unresolvedCount: number;
            unresolved: Array<{ placeQuery: string; reason: string }>;
        };
    };
    return payload.results;
}

export interface ResolvePlacesResponse {
    results: PlaceResolveItem[];
    meta?: {
        total: number;
        unresolvedCount: number;
        unresolved: Array<{ placeQuery: string; reason: string }>;
    };
}

export async function resolvePlacesRequestWithMeta(
    queries: PlaceResolveQuery[]
): Promise<ResolvePlacesResponse> {
    const response = await fetch(`${API_BASE_URL}/places/resolve`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ queries }),
    });

    if (!response.ok) {
        throw new Error(await parseApiError(response));
    }

    return (await response.json()) as ResolvePlacesResponse;
}
