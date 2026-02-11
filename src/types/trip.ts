import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

export type TravelType =
    | 'solo'
    | 'romantic'
    | 'adventure'
    | 'sightseeing'
    | 'activity'
    | 'family'
    | 'business';

export type Pace = 'relaxed' | 'balanced' | 'packed';

export type Currency = 'AUD' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'SGD';

export interface DestinationItem {
    city: string;
    country: string;
}

export interface TripProfile {
    id: string; // uuid
    createdAt: string; // ISO
    destinations: DestinationItem[];

    dateMode: 'range' | 'duration';
    startDate?: string; // ISO date
    endDate?: string; // ISO date
    durationDays: number;

    currency: Currency;
    budgetTotal: number;
    budgetPerDay?: number;

    travelType: TravelType;
    pace: Pace;

    interests: string[];

    constraints: {
        dietary?: string;
        accessibility?: string;
        withKids: boolean;
        mustSee: string[];
        avoid: string[];
    };

    companionsCount: number;

    preferences: {
        walkingTolerance: number; // 0-10
        dayStartPreference: number; // 0-10 (early->late)
        comfortVsBudget?: number; // 0-10
    };
}

// ============================================================================
// Form Data Interface (used during wizard)
// ============================================================================

export interface TripFormData {
    // Step 1: Destinations
    destinations: DestinationItem[];

    // Step 2: Dates
    dateMode: 'range' | 'duration';
    startDate?: string;
    endDate?: string;
    durationDays?: number;

    // Step 3: Budget
    currency: Currency;
    budgetTotal: number;
    enablePerDayBudget: boolean;
    budgetPerDay?: number;

    // Step 4: Style
    travelType: TravelType;
    pace: Pace;
    interests: string[];

    // Step 5: Constraints
    dietary?: string;
    accessibility?: string;
    withKids: boolean;
    mustSee: string[];
    avoid: string[];
    companionsCount: number;
    walkingTolerance: number;
    dayStartPreference: number;
    comfortVsBudget: number;
}

// ============================================================================
// Zod Validation Schemas
// ============================================================================

export const destinationSchema = z.object({
    city: z.string().min(1, 'City is required'),
    country: z.string().min(1, 'Country is required'),
});

export const destinationsStepSchema = z.object({
    destinations: z
        .array(destinationSchema)
        .min(1, 'At least one destination is required'),
});

export const datesStepSchema = z
    .object({
        dateMode: z.enum(['range', 'duration']),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        durationDays: z.number().optional(),
    })
    .refine(
        (data) => {
            if (data.dateMode === 'range') {
                return !!data.startDate && !!data.endDate;
            }
            return !!data.durationDays && data.durationDays > 0;
        },
        {
            message: 'Please provide valid dates or duration',
            path: ['dateMode'],
        }
    )
    .refine(
        (data) => {
            if (data.dateMode === 'range' && data.startDate && data.endDate) {
                return new Date(data.endDate) >= new Date(data.startDate);
            }
            return true;
        },
        {
            message: 'End date must be after start date',
            path: ['endDate'],
        }
    );

export const budgetStepSchema = z.object({
    currency: z.enum(['AUD', 'USD', 'EUR', 'GBP', 'JPY', 'SGD']),
    budgetTotal: z.number().min(1, 'Budget must be greater than 0'),
    enablePerDayBudget: z.boolean(),
    budgetPerDay: z.number().optional(),
});

export const styleStepSchema = z.object({
    travelType: z.enum([
        'solo',
        'romantic',
        'adventure',
        'sightseeing',
        'activity',
        'family',
        'business',
    ]),
    pace: z.enum(['relaxed', 'balanced', 'packed']),
    interests: z.array(z.string()).min(1, 'Select at least one interest'),
});

export const constraintsStepSchema = z.object({
    dietary: z.string().optional(),
    accessibility: z.string().optional(),
    withKids: z.boolean(),
    mustSee: z.array(z.string()),
    avoid: z.array(z.string()),
    companionsCount: z.number().min(1).max(10),
    walkingTolerance: z.number().min(0).max(10),
    dayStartPreference: z.number().min(0).max(10),
    comfortVsBudget: z.number().min(0).max(10),
});

// Complete form schema (for final validation)
export const tripFormSchema = z.object({
    ...destinationsStepSchema.shape,
    ...datesStepSchema.shape,
    ...budgetStepSchema.shape,
    ...styleStepSchema.shape,
    ...constraintsStepSchema.shape,
});

// ============================================================================
// Constants
// ============================================================================

export const TRAVEL_TYPES: { value: TravelType; label: string; icon: string }[] = [
    { value: 'solo', label: 'Solo Travel', icon: '🧳' },
    { value: 'romantic', label: 'Romantic', icon: '💑' },
    { value: 'adventure', label: 'Adventure', icon: '🏔️' },
    { value: 'sightseeing', label: 'Sightseeing', icon: '📸' },
    { value: 'activity', label: 'Activity-Based', icon: '🎯' },
    { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
    { value: 'business', label: 'Business', icon: '💼' },
];

export const PACE_OPTIONS: { value: Pace; label: string; description: string }[] = [
    { value: 'relaxed', label: 'Relaxed', description: 'Take it easy, plenty of downtime' },
    { value: 'balanced', label: 'Balanced', description: 'Mix of activities and rest' },
    { value: 'packed', label: 'Packed', description: 'See and do as much as possible' },
];

export const INTEREST_OPTIONS = [
    { value: 'food', label: 'Food & Dining', icon: '🍽️' },
    { value: 'museums', label: 'Museums', icon: '🏛️' },
    { value: 'beaches', label: 'Beaches', icon: '🏖️' },
    { value: 'hikes', label: 'Hiking', icon: '🥾' },
    { value: 'nightlife', label: 'Nightlife', icon: '🌃' },
    { value: 'shopping', label: 'Shopping', icon: '🛍️' },
    { value: 'nature', label: 'Nature', icon: '🌿' },
    { value: 'history', label: 'History', icon: '📜' },
    { value: 'art', label: 'Art', icon: '🎨' },
    { value: 'wildlife', label: 'Wildlife', icon: '🦁' },
    { value: 'theme-parks', label: 'Theme Parks', icon: '🎢' },
    { value: 'photography', label: 'Photography', icon: '📷' },
];

export const CURRENCY_OPTIONS: { value: Currency; label: string; symbol: string }[] = [
    { value: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
    { value: 'USD', label: 'US Dollar', symbol: '$' },
    { value: 'EUR', label: 'Euro', symbol: '€' },
    { value: 'GBP', label: 'British Pound', symbol: '£' },
    { value: 'JPY', label: 'Japanese Yen', symbol: '¥' },
    { value: 'SGD', label: 'Singapore Dollar', symbol: 'S$' },
];
