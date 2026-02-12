import type { TripFormData, TripProfile } from '@/types/trip';

const DRAFT_STORAGE_KEY = 'travelai_draft_trip';
const TRIPS_STORAGE_KEY = 'travelai_trips';

// ============================================================================
// Draft Management
// ============================================================================

export function saveDraftToStorage(data: Partial<TripFormData>): void {
    try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save draft to localStorage:', error);
    }
}

export function loadDraftFromStorage(): Partial<TripFormData> | null {
    try {
        const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
        return draft ? JSON.parse(draft) : null;
    } catch (error) {
        console.error('Failed to load draft from localStorage:', error);
        return null;
    }
}

export function clearDraftFromStorage(): void {
    try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear draft from localStorage:', error);
    }
}

// ============================================================================
// Trip Profile Management
// ============================================================================

interface StoredTripProfile extends TripProfile {
    userId?: string;
}

export function saveTripProfile(profile: TripProfile, userId?: string): void {
    try {
        const trips = loadTripProfiles(undefined, true);
        const stored: StoredTripProfile = {
            ...profile,
            userId: userId ?? profile.userId,
        };
        trips.push(stored);
        localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
    } catch (error) {
        console.error('Failed to save trip profile:', error);
    }
}

export function loadTripProfiles(userId?: string, includeAll = false): TripProfile[] {
    try {
        const trips = localStorage.getItem(TRIPS_STORAGE_KEY);
        const parsed = trips ? (JSON.parse(trips) as StoredTripProfile[]) : [];
        if (includeAll) return parsed;
        if (!userId) return [];
        return parsed.filter((trip) => trip.userId === userId);
    } catch (error) {
        console.error('Failed to load trip profiles:', error);
        return [];
    }
}

export function deleteTripProfile(id: string): void {
    try {
        const trips = loadTripProfiles(undefined, true);
        const filtered = trips.filter((trip) => trip.id !== id);
        localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error('Failed to delete trip profile:', error);
    }
}

export function getTripProfile(id: string): TripProfile | null {
    try {
        const trips = loadTripProfiles(undefined, true);
        return trips.find((trip) => trip.id === id) || null;
    } catch (error) {
        console.error('Failed to get trip profile:', error);
        return null;
    }
}
