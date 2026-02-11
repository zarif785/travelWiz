import { z } from 'zod';

export const travelTypeSchema = z.enum([
    'solo',
    'romantic',
    'adventure',
    'sightseeing',
    'activity',
    'family',
    'business',
]);

export const paceSchema = z.enum(['relaxed', 'balanced', 'packed']);
export const currencySchema = z.enum(['AUD', 'USD', 'EUR', 'GBP', 'JPY', 'SGD']);

export const destinationItemSchema = z.object({
    city: z.string().min(1),
    country: z.string().min(1),
});

export const tripProfileSchema = z.object({
    id: z.string().min(1),
    createdAt: z.string().min(1),
    destinations: z.array(destinationItemSchema).min(1),
    dateMode: z.enum(['range', 'duration']),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    durationDays: z.number().int().min(1).max(60),
    currency: currencySchema,
    budgetTotal: z.number().min(0),
    budgetPerDay: z.number().min(0).optional(),
    travelType: travelTypeSchema,
    pace: paceSchema,
    interests: z.array(z.string().min(1)).default([]),
    constraints: z.object({
        dietary: z.string().optional(),
        accessibility: z.string().optional(),
        withKids: z.boolean(),
        mustSee: z.array(z.string().min(1)).default([]),
        avoid: z.array(z.string().min(1)).default([]),
    }),
    companionsCount: z.number().int().min(1).max(20),
    preferences: z.object({
        walkingTolerance: z.number().min(0).max(10),
        dayStartPreference: z.number().min(0).max(10),
        comfortVsBudget: z.number().min(0).max(10).optional(),
    }),
});

export const coordinatesSchema = z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
});

export const activitySchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    area: z.string().min(1),
    durationMinutes: z.number().int().min(15).max(1440),
    estimatedCost: z.number().min(0),
    costType: z.enum(['free', 'low', 'mid', 'high']),
    tags: z.array(z.string().min(1)).default([]),
    placeQuery: z.string().min(1),
    coordinatesCandidate: coordinatesSchema.optional(),
    travelNotes: z.string().optional(),
});

export const dayPlanSchema = z.object({
    dayNumber: z.number().int().min(1),
    date: z.string().optional(),
    theme: z.string().optional(),
    morning: z.array(activitySchema).default([]),
    afternoon: z.array(activitySchema).default([]),
    evening: z.array(activitySchema).default([]),
});

export const placeCandidateSchema = z.object({
    placeId: z.string().min(1),
    name: z.string().min(1),
    area: z.string().min(1),
    placeQuery: z.string().min(1),
    coordinatesCandidate: coordinatesSchema.optional(),
    tags: z.array(z.string().min(1)).default([]),
});

export const itinerarySchema = z.object({
    id: z.string().min(1),
    tripId: z.string().min(1).optional(),
    destinationSummary: z.string().min(1),
    totals: z.object({
        estimatedTotalCost: z.number().min(0),
        estimatedDailyAverageCost: z.number().min(0),
        currency: currencySchema,
        costNotes: z.string().optional(),
    }),
    days: z.array(dayPlanSchema).min(1),
    places: z.array(placeCandidateSchema).default([]),
    warnings: z.array(z.string().min(1)).optional(),
});

export const generateItineraryRequestSchema = z.object({
    tripProfile: tripProfileSchema,
});

export const refineTypeSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('cheaper') }),
    z.object({ type: z.literal('more_adventure') }),
    z.object({
        type: z.literal('swap_days'),
        dayA: z.number().int().min(1),
        dayB: z.number().int().min(1),
    }),
    z.object({ type: z.literal('add_free_activities') }),
    z.object({ type: z.literal('reduce_walking') }),
]);

export const refineItineraryRequestSchema = z
    .object({
        tripProfile: tripProfileSchema,
        currentItinerary: itinerarySchema,
        instruction: z.string().min(1).optional(),
        refine: refineTypeSchema.optional(),
    })
    .superRefine((value, ctx) => {
        if (!value.instruction && !value.refine) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Either instruction or refine payload is required',
                path: ['instruction'],
            });
        }
    });

export type TripProfile = z.infer<typeof tripProfileSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type DayPlan = z.infer<typeof dayPlanSchema>;
export type PlaceCandidate = z.infer<typeof placeCandidateSchema>;
export type Itinerary = z.infer<typeof itinerarySchema>;
export type RefinePayload = z.infer<typeof refineTypeSchema>;
