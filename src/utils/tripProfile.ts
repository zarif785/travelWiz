import { v4 as uuidv4 } from 'uuid';
import type { TripFormData, TripProfile } from '@/types/trip';

/**
 * Calculate duration in days between two dates
 */
export function calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1; // At least 1 day
}

/**
 * Calculate per-day budget
 */
export function calculatePerDayBudget(total: number, days: number): number {
    return Math.round((total / days) * 100) / 100; // Round to 2 decimals
}

/**
 * Transform form data into a complete TripProfile
 */
export function buildTripProfile(formData: TripFormData): TripProfile {
    // Calculate duration
    let durationDays: number;
    if (formData.dateMode === 'range' && formData.startDate && formData.endDate) {
        durationDays = calculateDuration(formData.startDate, formData.endDate);
    } else {
        durationDays = formData.durationDays || 1;
    }

    // Calculate per-day budget if enabled
    let budgetPerDay: number | undefined;
    if (formData.enablePerDayBudget) {
        budgetPerDay = formData.budgetPerDay || calculatePerDayBudget(formData.budgetTotal, durationDays);
    }

    const profile: TripProfile = {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        destinations: formData.destinations,

        dateMode: formData.dateMode,
        startDate: formData.startDate,
        endDate: formData.endDate,
        durationDays,

        currency: formData.currency,
        budgetTotal: formData.budgetTotal,
        budgetPerDay,

        travelType: formData.travelType,
        pace: formData.pace,
        interests: formData.interests,

        constraints: {
            dietary: formData.dietary,
            accessibility: formData.accessibility,
            withKids: formData.withKids,
            mustSee: formData.mustSee,
            avoid: formData.avoid,
        },

        companionsCount: formData.companionsCount,

        preferences: {
            walkingTolerance: formData.walkingTolerance,
            dayStartPreference: formData.dayStartPreference,
            comfortVsBudget: formData.comfortVsBudget,
        },
    };

    return profile;
}
