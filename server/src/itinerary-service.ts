import Anthropic from '@anthropic-ai/sdk';
import { createHash, randomUUID } from 'node:crypto';
import {
    itinerarySchema,
    type Activity,
    type Itinerary,
    type RefinePayload,
    type TripProfile,
} from './schemas';

type RouteType = 'generate' | 'refine';

interface ItineraryMeta {
    model: string;
    tokens?: number;
    createdAt: string;
    warnings?: string[];
}

interface LlmAttemptResult {
    itinerary: Itinerary;
    warnings: string[];
    tokens?: number;
}

interface BuildResult {
    itinerary: Itinerary;
    meta: ItineraryMeta;
}

const model = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';
const anthropic = process.env.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null;

const itineraryJsonSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'tripId', 'destinationSummary', 'totals', 'days', 'places'],
    properties: {
        id: { type: 'string' },
        tripId: { type: 'string' },
        destinationSummary: { type: 'string' },
        totals: {
            type: 'object',
            additionalProperties: false,
            required: ['estimatedTotalCost', 'estimatedDailyAverageCost', 'currency'],
            properties: {
                estimatedTotalCost: { type: 'number' },
                estimatedDailyAverageCost: { type: 'number' },
                currency: { type: 'string', enum: ['AUD', 'USD', 'EUR', 'GBP', 'JPY', 'SGD'] },
                costNotes: { type: 'string' },
            },
        },
        days: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['dayNumber', 'morning', 'afternoon', 'evening'],
                properties: {
                    dayNumber: { type: 'integer' },
                    date: { type: 'string' },
                    theme: { type: 'string' },
                    morning: { type: 'array', items: { $ref: '#/$defs/activity' } },
                    afternoon: { type: 'array', items: { $ref: '#/$defs/activity' } },
                    evening: { type: 'array', items: { $ref: '#/$defs/activity' } },
                },
            },
        },
        places: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['placeId', 'name', 'area', 'placeQuery', 'tags'],
                properties: {
                    placeId: { type: 'string' },
                    name: { type: 'string' },
                    area: { type: 'string' },
                    placeQuery: { type: 'string' },
                    coordinatesCandidate: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['lat', 'lng'],
                        properties: {
                            lat: { type: 'number' },
                            lng: { type: 'number' },
                        },
                    },
                    tags: { type: 'array', items: { type: 'string' } },
                },
            },
        },
        warnings: { type: 'array', items: { type: 'string' } },
    },
    $defs: {
        activity: {
            type: 'object',
            additionalProperties: false,
            required: [
                'id',
                'name',
                'description',
                'area',
                'durationMinutes',
                'estimatedCost',
                'costType',
                'tags',
                'placeQuery',
            ],
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                area: { type: 'string' },
                durationMinutes: { type: 'number' },
                estimatedCost: { type: 'number' },
                costType: { type: 'string', enum: ['free', 'low', 'mid', 'high'] },
                tags: { type: 'array', items: { type: 'string' } },
                placeQuery: { type: 'string' },
                coordinatesCandidate: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['lat', 'lng'],
                    properties: {
                        lat: { type: 'number' },
                        lng: { type: 'number' },
                    },
                },
                travelNotes: { type: 'string' },
            },
        },
    },
};

function buildSystemPrompt(): string {
    return [
        'You are a senior travel planner.',
        'Output must be strict valid JSON only with no markdown and no prose.',
        'Output must match the exact schema provided.',
        'Every activity must include a specific non-empty area/neighborhood and placeQuery.',
        'Respect budget, pace, interests, mustSee, avoid constraints, and companions.',
        'Costs and durations must be realistic and internally consistent.',
        'days.length must equal tripProfile.durationDays.',
        'morning, afternoon, evening keys are required arrays for each day.',
        'No null values for required fields.',
    ].join('\n');
}

function buildDeveloperPrompt(routeType: RouteType, extraInstruction?: string): string {
    return [
        'Schema rules:',
        '- Use currency from tripProfile.currency.',
        '- Use numbers for costs and durations; no strings for numeric fields.',
        '- Keep activity durations between 30 and 300 minutes normally.',
        '- Make totals approximately equal to sum of activities.',
        '- Include varied tags per activity.',
        '- Place candidates should be deduplicated and map-safe.',
        `Output JSON schema (target shape): ${JSON.stringify(itineraryJsonSchema)}`,
        routeType === 'refine'
            ? '- Keep the current itinerary structure and only adjust what instruction requests.'
            : '- Build a complete itinerary from scratch.',
        extraInstruction ? `Refine instruction: ${extraInstruction}` : '',
    ]
        .filter(Boolean)
        .join('\n');
}

function makeUserPrompt(
    routeType: RouteType,
    tripProfile: TripProfile,
    currentItinerary?: Itinerary,
    instruction?: string
): string {
    const sections = [
        `tripProfile JSON:\n${JSON.stringify(tripProfile)}`,
        routeType === 'refine' && currentItinerary
            ? `currentItinerary JSON:\n${JSON.stringify(currentItinerary)}`
            : '',
        instruction ? `instruction:\n${instruction}` : '',
    ].filter(Boolean);

    return sections.join('\n\n');
}

function createFallbackActivity(
    tripProfile: TripProfile,
    partOfDay: 'morning' | 'afternoon' | 'evening',
    dayNumber: number
): Activity {
    const destination = tripProfile.destinations[0];
    const baseName =
        partOfDay === 'morning'
            ? 'Neighborhood Orientation Walk'
            : partOfDay === 'afternoon'
              ? 'Local Highlights Exploration'
              : 'Relaxed Local Dinner Area';
    const area = `${destination.city} central district`;
    const estimatedCost =
        partOfDay === 'evening' ? Math.max(10, Math.round((tripProfile.budgetTotal / tripProfile.durationDays) * 0.2)) : 0;

    return {
        id: randomUUID(),
        name: `${baseName} (Day ${dayNumber})`,
        description: `A practical ${partOfDay} plan in ${destination.city} that follows your profile constraints.`,
        area,
        durationMinutes: partOfDay === 'afternoon' ? 150 : 90,
        estimatedCost,
        costType: estimatedCost === 0 ? 'free' : estimatedCost < 30 ? 'low' : estimatedCost < 80 ? 'mid' : 'high',
        tags: partOfDay === 'evening' ? ['food', 'local'] : ['sightseeing', 'local'],
        placeQuery: `${destination.city} ${area}`,
        travelNotes: 'Times and pricing are approximated as fallback values.',
    };
}

function buildFallbackItinerary(tripProfile: TripProfile, extraWarnings: string[] = []): Itinerary {
    const days = Array.from({ length: tripProfile.durationDays }, (_, i) => {
        const dayNumber = i + 1;
        return {
            dayNumber,
            theme: `Day ${dayNumber} in ${tripProfile.destinations[0]?.city ?? 'destination'}`,
            morning: [createFallbackActivity(tripProfile, 'morning', dayNumber)],
            afternoon: [createFallbackActivity(tripProfile, 'afternoon', dayNumber)],
            evening: [createFallbackActivity(tripProfile, 'evening', dayNumber)],
            date:
                tripProfile.startDate && !Number.isNaN(new Date(tripProfile.startDate).getTime())
                    ? new Date(new Date(tripProfile.startDate).getTime() + i * 86400000).toISOString().slice(0, 10)
                    : undefined,
        };
    });

    const normalized = normalizeItinerary(
        {
            id: randomUUID(),
            tripId: tripProfile.id,
            destinationSummary: `A practical ${tripProfile.durationDays}-day plan for ${tripProfile.destinations
                .map((d) => `${d.city}, ${d.country}`)
                .join(' and ')}`,
            totals: {
                estimatedTotalCost: tripProfile.budgetTotal,
                estimatedDailyAverageCost: tripProfile.durationDays ? tripProfile.budgetTotal / tripProfile.durationDays : 0,
                currency: tripProfile.currency,
                costNotes: 'Fallback cost estimates generated due to AI formatting issues.',
            },
            days,
            places: [],
            warnings: ['Fallback itinerary generated due to model validation issues.', ...extraWarnings],
        },
        tripProfile
    );

    return itinerarySchema.parse(normalized);
}

function inferCostType(cost: number): 'free' | 'low' | 'mid' | 'high' {
    if (cost <= 0) return 'free';
    if (cost <= 30) return 'low';
    if (cost <= 100) return 'mid';
    return 'high';
}

function toNonEmptyString(value: unknown, fallback: string): string {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    return fallback;
}

function toNumber(value: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
    const n = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(n)) {
        return Math.max(min, Math.min(max, n));
    }
    return fallback;
}

function normalizeTags(tags: unknown): string[] {
    if (!Array.isArray(tags)) return ['sightseeing'];
    const cleaned = tags
        .map((tag) => (typeof tag === 'string' ? tag.trim().toLowerCase() : ''))
        .filter(Boolean);
    return cleaned.length > 0 ? Array.from(new Set(cleaned)).slice(0, 8) : ['sightseeing'];
}

function normalizeCoordinates(value: unknown): { lat: number; lng: number } | undefined {
    if (!value || typeof value !== 'object') return undefined;
    const candidate = value as { lat?: unknown; lng?: unknown };
    const lat = Number(candidate.lat);
    const lng = Number(candidate.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return undefined;
    return { lat, lng };
}

function makeStablePlaceId(placeQuery: string): string {
    const hash = createHash('sha1').update(placeQuery.toLowerCase()).digest('hex');
    return hash.slice(0, 16);
}

function normalizeActivity(value: unknown, index: number, defaultArea: string): Activity {
    const raw = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
    const name = toNonEmptyString(raw.name, `Activity ${index + 1}`);
    const area = toNonEmptyString(raw.area, defaultArea);
    const estimatedCost = toNumber(raw.estimatedCost, 0, 0, 100000);
    const costType =
        raw.costType === 'free' || raw.costType === 'low' || raw.costType === 'mid' || raw.costType === 'high'
            ? raw.costType
            : inferCostType(estimatedCost);
    const placeQuery = toNonEmptyString(raw.placeQuery, `${name} ${area}`);

    return {
        id: toNonEmptyString(raw.id, randomUUID()),
        name,
        description: toNonEmptyString(raw.description, `${name} in ${area}.`),
        area,
        durationMinutes: Math.round(toNumber(raw.durationMinutes, 90, 30, 480)),
        estimatedCost,
        costType,
        tags: normalizeTags(raw.tags),
        placeQuery,
        coordinatesCandidate: normalizeCoordinates(raw.coordinatesCandidate),
        travelNotes: typeof raw.travelNotes === 'string' ? raw.travelNotes.trim() || undefined : undefined,
    };
}

function normalizeItinerary(value: unknown, tripProfile: TripProfile): Itinerary {
    const raw = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
    const destinationSummaryFallback = tripProfile.destinations.map((d) => `${d.city}, ${d.country}`).join(' • ');
    const avoidTerms = tripProfile.constraints.avoid.map((a) => a.toLowerCase());
    const mustSeeTerms = tripProfile.constraints.mustSee;

    const normalizeSection = (activitiesRaw: unknown, areaFallback: string): Activity[] => {
        if (!Array.isArray(activitiesRaw)) return [];
        return activitiesRaw
            .map((item, idx) => normalizeActivity(item, idx, areaFallback))
            .filter((activity) => {
                const text = `${activity.name} ${activity.description}`.toLowerCase();
                return !avoidTerms.some((term) => text.includes(term));
            })
            .slice(0, 5);
    };

    const rawDays = Array.isArray(raw.days) ? raw.days : [];
    const days = Array.from({ length: tripProfile.durationDays }, (_, index) => {
        const dayNumber = index + 1;
        const dayRaw =
            (rawDays[index] && typeof rawDays[index] === 'object' ? rawDays[index] : {}) as Record<string, unknown>;
        const areaFallback = `${tripProfile.destinations[0]?.city ?? 'Destination'} central area`;
        const morning = normalizeSection(dayRaw.morning, areaFallback);
        const afternoon = normalizeSection(dayRaw.afternoon, areaFallback);
        const evening = normalizeSection(dayRaw.evening, areaFallback);

        if (morning.length + afternoon.length + evening.length === 0) {
            afternoon.push(createFallbackActivity(tripProfile, 'afternoon', dayNumber));
        }

        return {
            dayNumber,
            date:
                typeof dayRaw.date === 'string'
                    ? dayRaw.date
                    : tripProfile.startDate
                      ? new Date(new Date(tripProfile.startDate).getTime() + index * 86400000)
                            .toISOString()
                            .slice(0, 10)
                      : undefined,
            theme: typeof dayRaw.theme === 'string' ? dayRaw.theme : undefined,
            morning,
            afternoon,
            evening,
        };
    });

    // Ensure must-see items appear at least once.
    mustSeeTerms.forEach((mustSee, idx) => {
        const hasMustSee = days.some((day) =>
            [...day.morning, ...day.afternoon, ...day.evening]
                .map((activity) => `${activity.name} ${activity.description}`.toLowerCase())
                .some((content) => content.includes(mustSee.toLowerCase()))
        );

        if (!hasMustSee && days.length > 0) {
            const targetDay = days[idx % days.length];
            targetDay.afternoon.push({
                id: randomUUID(),
                name: mustSee,
                description: `Must-see activity requested in your constraints: ${mustSee}.`,
                area: `${tripProfile.destinations[0]?.city ?? 'Destination'} central area`,
                durationMinutes: 120,
                estimatedCost: 0,
                costType: 'free',
                tags: ['must-see'],
                placeQuery: `${mustSee} ${tripProfile.destinations[0]?.city ?? ''}`.trim(),
                travelNotes: 'Added to satisfy must-see preference.',
            });
        }
    });

    const allActivities = days.flatMap((day) => [...day.morning, ...day.afternoon, ...day.evening]);
    const estimatedTotalCost = allActivities.reduce((sum, activity) => sum + activity.estimatedCost, 0);
    const estimatedDailyAverageCost = days.length > 0 ? estimatedTotalCost / days.length : 0;
    const placeMap = new Map<
        string,
        {
            placeId: string;
            name: string;
            area: string;
            placeQuery: string;
            coordinatesCandidate?: { lat: number; lng: number };
            tags: string[];
        }
    >();

    allActivities.forEach((activity) => {
        const key = activity.placeQuery.trim().toLowerCase();
        if (!key) return;
        if (!placeMap.has(key)) {
            placeMap.set(key, {
                placeId: makeStablePlaceId(activity.placeQuery),
                name: activity.name,
                area: activity.area,
                placeQuery: activity.placeQuery,
                coordinatesCandidate: activity.coordinatesCandidate,
                tags: activity.tags,
            });
            return;
        }

        const existing = placeMap.get(key);
        if (!existing) return;
        const mergedTags = Array.from(new Set([...existing.tags, ...activity.tags]));
        placeMap.set(key, {
            ...existing,
            tags: mergedTags.slice(0, 8),
        });
    });

    const warnings = Array.isArray(raw.warnings)
        ? raw.warnings.filter((w): w is string => typeof w === 'string' && w.trim().length > 0)
        : [];

    return {
        id: toNonEmptyString(raw.id, randomUUID()),
        tripId: tripProfile.id,
        destinationSummary: toNonEmptyString(raw.destinationSummary, destinationSummaryFallback),
        totals: {
            estimatedTotalCost,
            estimatedDailyAverageCost,
            currency: tripProfile.currency,
            costNotes:
                typeof raw.totals === 'object' &&
                raw.totals &&
                typeof (raw.totals as { costNotes?: unknown }).costNotes === 'string'
                    ? (raw.totals as { costNotes?: string }).costNotes
                    : undefined,
        },
        days,
        places: Array.from(placeMap.values()),
        warnings: warnings.length ? warnings : undefined,
    };
}

function refineInstructionFromPayload(refine?: RefinePayload): string | undefined {
    if (!refine) return undefined;
    switch (refine.type) {
        case 'cheaper':
            return 'Make the itinerary cheaper while preserving key experiences.';
        case 'more_adventure':
            return 'Increase adventure and active experiences while remaining safe and realistic.';
        case 'add_free_activities':
            return 'Add more free activities and reduce paid items where possible.';
        case 'reduce_walking':
            return 'Reduce walking by clustering activities by nearby areas and minimizing transfers.';
        case 'swap_days':
            return `Swap full plans between day ${refine.dayA} and day ${refine.dayB}.`;
        default:
            return undefined;
    }
}

function swapDays(currentItinerary: Itinerary, dayA: number, dayB: number): Itinerary {
    const days = [...currentItinerary.days].map((day) => ({ ...day }));
    const idxA = dayA - 1;
    const idxB = dayB - 1;

    if (!days[idxA] || !days[idxB]) {
        return {
            ...currentItinerary,
            warnings: [...(currentItinerary.warnings ?? []), 'Requested day swap was out of range and skipped.'],
        };
    }

    const temp = { ...days[idxA] };
    days[idxA] = { ...days[idxB], dayNumber: dayA };
    days[idxB] = { ...temp, dayNumber: dayB };

    return itinerarySchema.parse({
        ...currentItinerary,
        days,
        warnings: [...(currentItinerary.warnings ?? []), `Swapped day ${dayA} with day ${dayB}.`],
    });
}

function stripJsonFences(content: string): string {
    const trimmed = content.trim();
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    return fenced ? fenced[1].trim() : trimmed;
}

async function requestItineraryFromModel(
    routeType: RouteType,
    tripProfile: TripProfile,
    currentItinerary?: Itinerary,
    instruction?: string
): Promise<LlmAttemptResult> {
    if (!anthropic) {
        return {
            itinerary: buildFallbackItinerary(tripProfile, ['ANTHROPIC_API_KEY is not configured on server.']),
            warnings: ['Used fallback itinerary because model client is unavailable.'],
        };
    }

    const systemPrompt = `${buildSystemPrompt()}\n\n${buildDeveloperPrompt(routeType, instruction)}`;
    const userPrompt = makeUserPrompt(routeType, tripProfile, currentItinerary, instruction);

    let lastError = 'Unknown validation error';
    let lastRaw = '';

    for (let attempt = 0; attempt < 3; attempt += 1) {
        const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userPrompt }];
        if (attempt > 0) {
            messages.push({
                role: 'user',
                content: [
                    'Your previous output did not pass strict schema validation.',
                    `Error summary: ${lastError}`,
                    'Fix the JSON strictly to the schema.',
                    'Return JSON only.',
                    lastRaw ? `Previous output:\n${lastRaw}` : '',
                ]
                    .filter(Boolean)
                    .join('\n'),
            });
        }

        const completion = await anthropic.messages.create({
            model,
            max_tokens: 16000,
            system: systemPrompt,
            messages,
        });

        const content = completion.content
            .map((block) => (block.type === 'text' ? block.text : ''))
            .join('');
        if (!content) {
            lastError = 'Model returned empty content.';
            continue;
        }

        lastRaw = content;
        try {
            const parsed = JSON.parse(stripJsonFences(content)) as unknown;
            const normalized = normalizeItinerary(parsed, tripProfile);
            const itinerary = itinerarySchema.parse(normalized);

            return {
                itinerary,
                warnings: attempt > 0 ? ['Model output required retry-based JSON correction.'] : [],
                tokens: completion.usage.input_tokens + completion.usage.output_tokens,
            };
        } catch (error) {
            lastError = error instanceof Error ? error.message : 'Unknown parse/validation error';
        }
    }

    return {
        itinerary: buildFallbackItinerary(tripProfile, [lastError]),
        warnings: ['Model output remained invalid after retries; returned fallback itinerary.'],
    };
}

export async function generateItinerary(tripProfile: TripProfile): Promise<BuildResult> {
    const result = await requestItineraryFromModel('generate', tripProfile);
    return {
        itinerary: result.itinerary,
        meta: {
            model,
            tokens: result.tokens,
            createdAt: new Date().toISOString(),
            warnings: result.warnings.length ? result.warnings : undefined,
        },
    };
}

export async function refineItinerary(
    tripProfile: TripProfile,
    currentItinerary: Itinerary,
    instruction?: string,
    refine?: RefinePayload
): Promise<BuildResult> {
    if (refine?.type === 'swap_days') {
        const swapped = swapDays(currentItinerary, refine.dayA, refine.dayB);
        return {
            itinerary: swapped,
            meta: {
                model,
                createdAt: new Date().toISOString(),
                warnings: ['Used deterministic server-side day swapping.'],
            },
        };
    }

    const mergedInstruction = [refineInstructionFromPayload(refine), instruction].filter(Boolean).join(' ');
    const result = await requestItineraryFromModel('refine', tripProfile, currentItinerary, mergedInstruction);

    return {
        itinerary: result.itinerary,
        meta: {
            model,
            tokens: result.tokens,
            createdAt: new Date().toISOString(),
            warnings: result.warnings.length ? result.warnings : undefined,
        },
    };
}
